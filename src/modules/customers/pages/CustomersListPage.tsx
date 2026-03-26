import { Anchor, Card, Group, Modal, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../../../shared/api/http'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import type { Customer } from '../../../shared/api/mockDb'

type CustomersResponse = { items: Customer[] }

export function CustomersListPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await http.get<CustomersResponse>('/customers')
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
    return items.filter((c) => `${c.name} ${c.email} ${c.phone ?? ''}`.toLowerCase().includes(needle))
  }, [items, q])

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (r) => (
        <Anchor
          component="button"
          type="button"
          onClick={() => setSelected(r)}
          style={{ textAlign: 'left' }}
        >
          {r.name}
        </Anchor>
      ),
    },
    { key: 'email', header: 'Email', sortable: true, render: (r) => r.email },
    { key: 'phone', header: 'Phone', sortable: true, render: (r) => r.phone ?? '—' },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Customers</Title>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack>
          <TextInput value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search customers…" />
          <DataTable columns={columns} rows={filtered} loading={loading} pageSize={10} />
        </Stack>
      </Card>

      <Modal opened={selected !== null} onClose={() => setSelected(null)} title="Customer details" centered>
        {selected ? (
          <Stack gap="xs">
            <Text fw={600}>{selected.name}</Text>
            <Text size="sm" c="dimmed">
              {selected.email}
            </Text>
            <Text size="sm">Phone: {selected.phone ?? '—'}</Text>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  )
}

