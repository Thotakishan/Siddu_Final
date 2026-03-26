import { Role, type User } from '../types/auth'

export type Product = {
  id: string
  sku: string
  name: string
  price: number
  category: string
  active: boolean
}

export type InventoryItem = {
  productId: string
  onHand: number
  reorderPoint: number
}

export enum OrderStatus {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Shipped = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED',
}

export type OrderLine = {
  productId: string
  qty: number
  unitPrice: number
}

export type Order = {
  id: string
  customerId: string
  status: OrderStatus
  createdAt: string
  lines: OrderLine[]
}

export type Customer = {
  id: string
  name: string
  email: string
  phone?: string
}

export type ReportStats = {
  totalOrders: number
  revenue: number
  lowStockCount: number
  activeProducts: number
}

function id() {
  return crypto.randomUUID()
}

export const users: User[] = [
  { id: id(), name: 'Admin User', email: 'admin@demo.com', role: Role.Admin },
  {
    id: id(),
    name: 'Inventory Manager',
    email: 'inventory@demo.com',
    role: Role.InventoryManager,
  },
  {
    id: id(),
    name: 'Sales Manager',
    email: 'sales@demo.com',
    role: Role.SalesManager,
  },
  { id: id(), name: 'Support Agent', email: 'support@demo.com', role: Role.Support },
  { id: id(), name: 'Customer', email: 'customer@demo.com', role: Role.Customer },
]

export const products: Product[] = [
  { id: id(), sku: 'SKU-1001', name: 'Wireless Mouse', price: 24.99, category: 'Accessories', active: true },
  { id: id(), sku: 'SKU-1002', name: 'Mechanical Keyboard', price: 89.0, category: 'Accessories', active: true },
  { id: id(), sku: 'SKU-2001', name: 'USB-C Cable', price: 9.5, category: 'Cables', active: true },
  { id: id(), sku: 'SKU-3001', name: '27\" Monitor', price: 219.99, category: 'Displays', active: true },
  { id: id(), sku: 'SKU-9001', name: 'Legacy Adapter', price: 15.0, category: 'Adapters', active: false },
]

export const inventory: InventoryItem[] = products.map((p, idx) => ({
  productId: p.id,
  onHand: idx === 2 ? 4 : 25 + idx * 3,
  reorderPoint: 10,
}))

export const customers: Customer[] = [
  { id: id(), name: 'Acme Corp', email: 'buyer@acme.com', phone: '+1 555 0101' },
  { id: id(), name: 'Globex', email: 'orders@globex.com', phone: '+1 555 0102' },
  { id: id(), name: 'Initech', email: 'purchasing@initech.com', phone: '+1 555 0103' },
]

export const orders: Order[] = [
  {
    id: id(),
    customerId: customers[0]!.id,
    status: OrderStatus.Processing,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    lines: [
      { productId: products[0]!.id, qty: 2, unitPrice: products[0]!.price },
      { productId: products[2]!.id, qty: 5, unitPrice: products[2]!.price },
    ],
  },
  {
    id: id(),
    customerId: customers[1]!.id,
    status: OrderStatus.Shipped,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    lines: [{ productId: products[1]!.id, qty: 1, unitPrice: products[1]!.price }],
  },
]

export const sessions = {
  refreshToUserId: new Map<string, string>(),
  accessExpiryMs: new Map<string, number>(),
  accessToUserId: new Map<string, string>(),
}

export function computeStats(): ReportStats {
  const totalOrders = orders.length
  const revenue = orders.reduce((sum, o) => {
    const t = o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    return sum + t
  }, 0)
  const lowStockCount = inventory.filter((i) => i.onHand <= i.reorderPoint).length
  const activeProducts = products.filter((p) => p.active).length
  return { totalOrders, revenue: Math.round(revenue * 100) / 100, lowStockCount, activeProducts }
}

