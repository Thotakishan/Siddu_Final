import { Badge, Card, Stack, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { http } from '../../../shared/api/http'
import { DataTable, type DataTableColumn } from '../../../shared/components/DataTable'
import type { Order } from '../../../shared/api/mockDb'

type IssuesResponse = { items: Order[] }

type IssueRow = {
  id: string
  createdAt: string
  status: string
  message: string
}

export function IssuesPage() {
  const [rows, setRows] = useState<IssueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await http.get<IssuesResponse>('/issues')
        const mapped = res.data.items
          .filter((o) => o.issue)
          .map((o) => ({
            id: o.id,
            createdAt: o.issue?.createdAt ?? o.createdAt,
            status: o.status,
            message: o.issue?.message ?? '',
          }))
        if (mounted) setRows(mapped)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const columns: DataTableColumn<IssueRow>[] = [
    { key: 'id', header: 'Order', sortable: true, render: (r) => r.id.slice(0, 8) },
    { key: 'createdAt', header: 'Raised', sortable: true, render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: 'message', header: 'Issue', sortable: true, render: (r) => r.message },
    { key: 'status', header: 'Order status', sortable: true, render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <Stack>
      <Title order={2}>Customer Issues</Title>
      <Card withBorder radius="md" p="md">
        <DataTable columns={columns} rows={rows} loading={loading} pageSize={10} />
      </Card>
    </Stack>
  )
}

