import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { computeStats, customers, inventory, orders, products, sessions, users, type Customer, type InventoryItem, type Order, type Product, OrderStatus } from './mockDb'
import { type AuthTokens, type User } from '../types/auth'

type ApiError = { message: string }
type LoginBody = { email: string; password: string }
type RefreshBody = { refreshToken: string }

const ACCESS_TTL_MS = 60_000

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function now() {
  return Date.now()
}

function json<T>(config: InternalAxiosRequestConfig, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  }
}

function parseBody<T>(config: InternalAxiosRequestConfig): T | null {
  const raw = config.data
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return raw as T
}

function bearer(config: InternalAxiosRequestConfig): string | null {
  const h = config.headers
  const auth = h.Authorization
  if (typeof auth !== 'string') return null
  const m = auth.match(/^Bearer\s+(.+)$/)
  return m ? m[1] : null
}

function requireAuth(config: InternalAxiosRequestConfig): { user: User } | AxiosResponse<ApiError> {
  const token = bearer(config)
  if (!token) return json(config, 401, { message: 'Missing token' })
  const exp = sessions.accessExpiryMs.get(token)
  if (!exp || exp <= now()) return json(config, 401, { message: 'Token expired' })
  const userId = sessions.accessToUserId.get(token)
  if (!userId) return json(config, 401, { message: 'Invalid token' })
  const user = users.find((u) => u.id === userId)
  if (!user) return json(config, 401, { message: 'Invalid token' })
  return { user }
}

function issueTokens(user: User): AuthTokens {
  const accessToken = `access_${crypto.randomUUID()}`
  const refreshToken = `refresh_${crypto.randomUUID()}`
  const expiresAtMs = now() + ACCESS_TTL_MS
  sessions.refreshToUserId.set(refreshToken, user.id)
  sessions.accessExpiryMs.set(accessToken, expiresAtMs)
  sessions.accessToUserId.set(accessToken, user.id)
  return { accessToken, refreshToken, expiresAtMs }
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(250)
  const url = (config.url ?? '').replace(/^\//, '')
  const method = (config.method ?? 'get').toLowerCase()

  // Auth
  if (method === 'post' && url === 'auth/login') {
    const body = parseBody<LoginBody>(config)
    if (!body?.email || !body.password) return json(config, 400, { message: 'Invalid credentials' })
    const user = users.find((u) => u.email.toLowerCase() === body.email.toLowerCase())
    if (!user) return json(config, 401, { message: 'Invalid email/password' })
    const tokens = issueTokens(user)
    return json(config, 200, { user, tokens })
  }

  if (method === 'post' && url === 'auth/refresh') {
    const body = parseBody<RefreshBody>(config)
    const refreshToken = body?.refreshToken
    if (!refreshToken) return json(config, 400, { message: 'Missing refresh token' })
    const userId = sessions.refreshToUserId.get(refreshToken)
    if (!userId) return json(config, 401, { message: 'Invalid refresh token' })
    const user = users.find((u) => u.id === userId)
    if (!user) return json(config, 401, { message: 'Invalid refresh token' })
    const tokens = issueTokens(user)
    return json(config, 200, { user, tokens })
  }

  // Protected endpoints
  if (url.startsWith('products') || url.startsWith('inventory') || url.startsWith('orders') || url.startsWith('customers') || url.startsWith('reports')) {
    const auth = requireAuth(config)
    if ('status' in auth) return auth
    void auth.user
  }

  // Products
  if (method === 'get' && url === 'products') {
    return json(config, 200, { items: products } as { items: Product[] })
  }

  if (method === 'post' && url === 'products') {
    const body = parseBody<Omit<Product, 'id'>>(config)
    if (!body) return json(config, 400, { message: 'Invalid body' })
    const next: Product = { id: crypto.randomUUID(), ...body }
    products.unshift(next)
    inventory.unshift({ productId: next.id, onHand: 0, reorderPoint: 10 })
    return json(config, 200, next)
  }

  if (method === 'put' && url.startsWith('products/')) {
    const id = url.split('/')[1]
    const body = parseBody<Omit<Product, 'id'>>(config)
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return json(config, 404, { message: 'Not found' })
    if (!body) return json(config, 400, { message: 'Invalid body' })
    products[idx] = { id, ...body }
    return json(config, 200, products[idx]!)
  }

  if (method === 'delete' && url.startsWith('products/')) {
    const id = url.split('/')[1]
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return json(config, 404, { message: 'Not found' })
    products.splice(idx, 1)
    const invIdx = inventory.findIndex((i) => i.productId === id)
    if (invIdx >= 0) inventory.splice(invIdx, 1)
    return json(config, 200, { ok: true } as { ok: true })
  }

  // Inventory
  if (method === 'get' && url === 'inventory') {
    return json(config, 200, { items: inventory } as { items: InventoryItem[] })
  }

  if (method === 'put' && url.startsWith('inventory/')) {
    const productId = url.split('/')[1]
    const body = parseBody<Pick<InventoryItem, 'onHand' | 'reorderPoint'>>(config)
    const idx = inventory.findIndex((i) => i.productId === productId)
    if (idx < 0) return json(config, 404, { message: 'Not found' })
    if (!body) return json(config, 400, { message: 'Invalid body' })
    inventory[idx] = { productId, onHand: body.onHand, reorderPoint: body.reorderPoint }
    return json(config, 200, inventory[idx]!)
  }

  // Orders
  if (method === 'get' && url === 'orders') {
    return json(config, 200, { items: orders } as { items: Order[] })
  }

  if (method === 'post' && url === 'orders') {
    const body = parseBody<Pick<Order, 'customerId' | 'lines'>>(config)
    if (!body?.customerId || !Array.isArray(body.lines) || body.lines.length === 0) {
      return json(config, 400, { message: 'Invalid order' })
    }
    const next: Order = {
      id: crypto.randomUUID(),
      customerId: body.customerId,
      status: OrderStatus.Pending,
      createdAt: new Date().toISOString(),
      lines: body.lines,
    }
    orders.unshift(next)
    return json(config, 200, next)
  }

  if (method === 'put' && url.startsWith('orders/')) {
    const orderId = url.split('/')[1]
    const body = parseBody<Pick<Order, 'status'>>(config)
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx < 0) return json(config, 404, { message: 'Not found' })
    if (!body?.status) return json(config, 400, { message: 'Invalid body' })
    orders[idx] = { ...orders[idx]!, status: body.status }
    return json(config, 200, orders[idx]!)
  }

  // Customers
  if (method === 'get' && url === 'customers') {
    return json(config, 200, { items: customers } as { items: Customer[] })
  }

  if (method === 'get' && url.startsWith('customers/')) {
    const id = url.split('/')[1]
    const customer = customers.find((c) => c.id === id)
    if (!customer) return json(config, 404, { message: 'Not found' })
    return json(config, 200, customer)
  }

  // Reports
  if (method === 'get' && url === 'reports/stats') {
    return json(config, 200, computeStats())
  }

  return json(config, 404, { message: `No mock route for ${method.toUpperCase()} /${url}` })
}

