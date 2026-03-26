import { Badge, Button, Card, Group, Select, Stack, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import type { Customer, Order, Product } from '../../../shared/api/mockDb'
import { OrderStatus } from '../../../shared/api/mockDb'
import { notifications } from '@mantine/notifications'

type OrdersResponse = { items: Order[] }
type CustomersResponse = { items: Customer[] }
type ProductsResponse = { items: Product[] }

type Row = {
  id: string
  createdAt: string
  customerName: string
  status: OrderStatus
  total: number
}

export function OrdersListPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [o, c, p] = await Promise.all([
          http.get<OrdersResponse>('/orders'),
          http.get<CustomersResponse>('/customers'),
          http.get<ProductsResponse>('/products'),
        ])
        const customersById = new Map(c.data.items.map((x) => [x.id, x]))
        const productsById = new Map(p.data.items.map((x) => [x.id, x]))
        const mapped: Row[] = o.data.items.map((ord) => {
          const cust = customersById.get(ord.customerId)
          const total = ord.lines.reduce((sum, l) => {
            const pr = productsById.get(l.productId)
            const price = pr?.price ?? l.unitPrice
            return sum + l.qty * price
          }, 0)
          return {
            id: ord.id,
            createdAt: ord.createdAt,
            customerName: cust?.name ?? 'Unknown',
            status: ord.status,
            total: Math.round(total * 100) / 100,
          }
        })
        if (mounted) setRows(mapped)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

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
    { key: 'total', header: 'Total', sortable: true, render: (r) => `$${r.total.toFixed(2)}` },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Orders</Title>
        <Button onClick={() => notifications.show({ title: 'Next step', message: 'Create Order flow will be wired next.' })}>
          New order
        </Button>
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
    </Stack>
  )
}

