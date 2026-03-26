import { Badge, Card, Group, Stack, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import type { InventoryItem, Product } from '../../../shared/api/mockDb'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'

type InventoryResponse = { items: InventoryItem[] }
type ProductsResponse = { items: Product[] }

type Row = {
  productId: string
  sku: string
  name: string
  onHand: number
  reorderPoint: number
}

export function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [inv, prod] = await Promise.all([
          http.get<InventoryResponse>('/inventory'),
          http.get<ProductsResponse>('/products'),
        ])
        const byId = new Map(prod.data.items.map((p) => [p.id, p]))
        const combined: Row[] = inv.data.items
          .map((i) => {
            const p = byId.get(i.productId)
            if (!p) return null
            return {
              productId: i.productId,
              sku: p.sku,
              name: p.name,
              onHand: i.onHand,
              reorderPoint: i.reorderPoint,
            }
          })
          .filter((x): x is Row => x !== null)
        if (mounted) setRows(combined)
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
    if (!needle) return rows
    return rows.filter((r) => `${r.sku} ${r.name}`.toLowerCase().includes(needle))
  }, [rows, q])

  const columns: DataTableColumn<Row>[] = [
    { key: 'sku', header: 'SKU', sortable: true, render: (r) => r.sku },
    { key: 'name', header: 'Product', sortable: true, render: (r) => r.name },
    {
      key: 'onHand',
      header: 'On hand',
      sortable: true,
      render: (r) => (
        <Group gap="xs">
          <span>{r.onHand}</span>
          {r.onHand <= r.reorderPoint ? <Badge color="red">Low</Badge> : null}
        </Group>
      ),
    },
    { key: 'reorderPoint', header: 'Reorder point', sortable: true, render: (r) => r.reorderPoint },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Inventory</Title>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack>
          <TextInput value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search inventory…" />
          <DataTable columns={columns} rows={filtered} loading={loading} pageSize={10} />
        </Stack>
      </Card>
    </Stack>
  )
}

