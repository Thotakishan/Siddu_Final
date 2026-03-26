import { Button, Card, Group, Stack, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import type { Customer, Product } from '../../../shared/api/mockDb'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../../shared/stores/authStore'
import { Role } from '../../../shared/types/auth'

type ProductsResponse = { items: Product[] }
type CustomersResponse = { items: Customer[] }

export function ProductsListPage() {
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await http.get<ProductsResponse>('/products')
        if (mounted) setItems(res.data.items)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!user || user.role !== Role.Customer) return
    let mounted = true
    ;(async () => {
      const res = await http.get<CustomersResponse>('/customers')
      const list = Array.isArray(res.data?.items) ? res.data.items : []
      const mine = list.find((c) => c.email.toLowerCase() === user.email.toLowerCase())
      if (mounted) setCustomerId(mine?.id ?? null)
    })()
    return () => {
      mounted = false
    }
  }, [user])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((p) => `${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(needle))
  }, [items, q])

  const columns: DataTableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', sortable: true, render: (r) => r.sku },
    { key: 'name', header: 'Name', sortable: true, render: (r) => r.name },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category },
    { key: 'price', header: 'Price', sortable: true, render: (r) => `$${r.price.toFixed(2)}` },
    { key: 'active', header: 'Active', sortable: true, render: (r) => (r.active ? 'Yes' : 'No') },
    {
      key: 'action',
      header: 'Action',
      render: (r) =>
        user?.role === Role.Customer ? (
          <Button
            size="xs"
            disabled={!r.active || !customerId}
            onClick={async () => {
              if (!customerId) {
                notifications.show({
                  color: 'red',
                  title: 'Customer profile missing',
                  message: 'Unable to place order right now.',
                })
                return
              }
              await http.post('/orders', {
                customerId,
                lines: [{ productId: r.id, qty: 1, unitPrice: r.price }],
              })
              notifications.show({
                color: 'teal',
                title: 'Order placed',
                message: `${r.name} added as a new order.`,
              })
            }}
          >
            Buy
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Products</Title>
        {user?.role !== Role.Customer ? (
          <Button
            onClick={() =>
              notifications.show({
                title: 'Next step',
                message: 'Product Add/Edit modal will be wired next.',
              })
            }
          >
            Add product
          </Button>
        ) : null}
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack>
          <TextInput value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search products…" />
          <DataTable columns={columns} rows={filtered} loading={loading} pageSize={8} />
        </Stack>
      </Card>
    </Stack>
  )
}

