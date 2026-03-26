import { Badge, Button, Card, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import type { Customer, Order, Product } from '../../../shared/api/mockDb'
import { OrderStatus } from '../../../shared/api/mockDb'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../../shared/stores/authStore'
import { Role } from '../../../shared/types/auth'
import { z } from 'zod'

type OrdersResponse = { items: Order[] }
type CustomersResponse = { items: Customer[] }
type ProductsResponse = { items: Product[] }

type Row = {
  id: string
  createdAt: string
  customerId: string
  customerName: string
  status: OrderStatus
  total: number
  hasIssue: boolean
}

const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  productId: z.string().min(1, 'Product is required'),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
})

const issueSchema = z.object({
  message: z.string().min(5, 'Issue must be at least 5 characters'),
})

export function OrdersListPage() {
  const user = useAuthStore((s) => s.user)
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [issueOrderId, setIssueOrderId] = useState<string | null>(null)

  const [newCustomerId, setNewCustomerId] = useState('')
  const [newProductId, setNewProductId] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [issueMessage, setIssueMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)

  const canManageStatus =
    user?.role === Role.Admin || user?.role === Role.SalesManager || user?.role === Role.Support

  const loadData = async () => {
    const [o, c, p] = await Promise.all([
      http.get<OrdersResponse>('/orders'),
      http.get<CustomersResponse>('/customers'),
      http.get<ProductsResponse>('/products'),
    ])
    const ordersList = Array.isArray(o.data?.items) ? o.data.items : []
    const customersList = Array.isArray(c.data?.items) ? c.data.items : []
    const productsList = Array.isArray(p.data?.items) ? p.data.items : []
    setCustomers(customersList)
    setProducts(productsList)

    const customersById = new Map(customersList.map((x) => [x.id, x]))
    const productsById = new Map(productsList.map((x) => [x.id, x]))
    const mapped: Row[] = ordersList.map((ord) => {
      const cust = customersById.get(ord.customerId)
      const total = ord.lines.reduce((sum, l) => {
        const pr = productsById.get(l.productId)
        const price = pr?.price ?? l.unitPrice
        return sum + l.qty * price
      }, 0)
      return {
        id: ord.id,
        customerId: ord.customerId,
        createdAt: ord.createdAt,
        customerName: cust?.name ?? 'Unknown',
        status: ord.status,
        total: Math.round(total * 100) / 100,
        hasIssue: Boolean(ord.issue),
      }
    })
    setRows(mapped)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await loadData()
      } catch {
        notifications.show({
          color: 'red',
          title: 'Could not load orders',
          message: 'Please refresh or try again.',
        })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user?.role !== Role.Customer) return
    const mine = customers.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
    if (mine) setNewCustomerId(mine.id)
  }, [customers, user])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      const okQ = !needle || `${r.id} ${r.customerName}`.toLowerCase().includes(needle)
      const okS = status === 'ALL' || r.status === status
      return okQ && okS
    })
  }, [rows, q, status])

  const columns: DataTableColumn<Row>[] = [
    { key: 'id', header: 'Order', sortable: true, render: (r) => r.id.slice(0, 8) },
    { key: 'createdAt', header: 'Created', sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'customerName', header: 'Customer', sortable: true, render: (r) => r.customerName },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <Badge variant="light">{r.status}</Badge>,
    },
    {
      key: 'issue',
      header: 'Issue',
      sortable: false,
      render: (r) => (r.hasIssue ? <Badge color="orange">Raised</Badge> : <Badge color="gray">None</Badge>),
    },
    { key: 'total', header: 'Total', sortable: true, render: (r) => `$${r.total.toFixed(2)}` },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <Group gap="xs">
          {canManageStatus ? (
            <Select
              size="xs"
              w={130}
              value={r.status}
              onChange={async (v) => {
                const next = (v as OrderStatus | null) ?? r.status
                if (next === r.status) return
                await http.put(`/orders/${r.id}`, { status: next })
                notifications.show({ color: 'teal', title: 'Updated', message: 'Order status updated.' })
                await loadData()
              }}
              data={Object.values(OrderStatus).map((s) => ({ value: s, label: s }))}
            />
          ) : null}
          {user?.role === Role.Customer && r.status !== OrderStatus.Cancelled ? (
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={async () => {
                await http.put(`/orders/${r.id}`, { status: OrderStatus.Cancelled })
                notifications.show({ color: 'teal', title: 'Cancelled', message: 'Your order was cancelled.' })
                await loadData()
              }}
            >
              Cancel
            </Button>
          ) : null}
          {user?.role === Role.Customer ? (
            <Button size="xs" variant="light" onClick={() => setIssueOrderId(r.id)}>
              Raise issue
            </Button>
          ) : null}
        </Group>
      ),
    },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Orders</Title>
        <Button onClick={() => setCreateOpen(true)}>New order</Button>
      </Group>

      <Card withBorder radius="md" p="md">
        <Group grow align="end">
          <TextInput value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search orders…" label="Search" />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus((v as OrderStatus | 'ALL') ?? 'ALL')}
            data={[
              { value: 'ALL', label: 'All' },
              ...Object.values(OrderStatus).map((s) => ({ value: s, label: s })),
            ]}
          />
        </Group>

        <Stack mt="md">
          <DataTable columns={columns} rows={filtered} loading={loading} pageSize={8} />
        </Stack>
      </Card>

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Create order" centered>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const parsed = createOrderSchema.safeParse({
              customerId: newCustomerId,
              productId: newProductId,
              qty: newQty,
            })
            if (!parsed.success) {
              setFormError(parsed.error.issues[0]?.message ?? 'Invalid form')
              return
            }
            setFormError(null)
            const product = products.find((p) => p.id === parsed.data.productId)
            if (!product) return
            await http.post('/orders', {
              customerId: parsed.data.customerId,
              lines: [{ productId: parsed.data.productId, qty: parsed.data.qty, unitPrice: product.price }],
            })
            notifications.show({ color: 'teal', title: 'Order created', message: 'Order is now visible to all allowed roles.' })
            setCreateOpen(false)
            setNewCustomerId('')
            setNewProductId('')
            setNewQty(1)
            await loadData()
          }}
        >
          <Stack>
            <Select
              label="Customer"
              value={newCustomerId}
              onChange={(v) => setNewCustomerId(v ?? '')}
              data={customers.map((c) => ({ value: c.id, label: c.name }))}
              disabled={user?.role === Role.Customer}
            />
            <Select
              label="Product"
              value={newProductId}
              onChange={(v) => setNewProductId(v ?? '')}
              data={products.map((p) => ({ value: p.id, label: `${p.name} ($${p.price.toFixed(2)})` }))}
            />
            <NumberInput
              label="Quantity"
              min={1}
              value={newQty}
              onChange={(val) => setNewQty(typeof val === 'number' ? val : 1)}
            />
            {formError ? <Badge color="red">{formError}</Badge> : null}
            <Button type="submit">Create</Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={issueOrderId !== null}
        onClose={() => {
          setIssueOrderId(null)
          setIssueMessage('')
          setIssueError(null)
        }}
        title="Raise customer issue"
        centered
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!issueOrderId) return
            const parsed = issueSchema.safeParse({ message: issueMessage })
            if (!parsed.success) {
              setIssueError(parsed.error.issues[0]?.message ?? 'Invalid issue')
              return
            }
            setIssueError(null)
            await http.post(`/orders/${issueOrderId}/issue`, { message: parsed.data.message })
            notifications.show({ color: 'teal', title: 'Issue raised', message: 'Support can now see this issue.' })
            setIssueOrderId(null)
            setIssueMessage('')
            await loadData()
          }}
        >
          <Stack>
            <Textarea
              label="Issue details"
              minRows={3}
              value={issueMessage}
              onChange={(e) => setIssueMessage(e.currentTarget.value)}
              error={issueError}
            />
            <Button type="submit">Submit issue</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}

