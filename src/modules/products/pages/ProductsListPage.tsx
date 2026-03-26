import { Button, Card, Group, Stack, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import type { Product } from '../../../shared/api/mockDb'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import { notifications } from '@mantine/notifications'

type ProductsResponse = { items: Product[] }

export function ProductsListPage() {
  const [items, setItems] = useState<Product[]>([])
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
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Products</Title>
        <Button
          onClick={() => notifications.show({ title: 'Next step', message: 'Product Add/Edit modal will be wired next.' })}
        >
          Add product
        </Button>
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

