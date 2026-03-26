import { Card, Grid, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { http } from '../../../shared/api/http'
import type { ReportStats } from '../../../shared/api/mockDb'

export function DashboardPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await http.get<ReportStats>('/reports/stats')
        if (mounted) setStats(res.data)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const cells = [
    { label: 'Total orders', value: stats?.totalOrders ?? 0 },
    { label: 'Revenue', value: `$${(stats?.revenue ?? 0).toLocaleString()}` },
    { label: 'Low stock items', value: stats?.lowStockCount ?? 0 },
    { label: 'Active products', value: stats?.activeProducts ?? 0 },
  ]

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
      </Group>

      <Grid>
        {cells.map((c) => (
          <Grid.Col key={c.label} span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="md" p="md">
              {loading ? (
                <Stack gap={6}>
                  <Skeleton h={14} w="70%" />
                  <Skeleton h={26} w="40%" />
                </Stack>
              ) : (
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">
                    {c.label}
                  </Text>
                  <Text fw={700} size="xl">
                    {c.value}
                  </Text>
                </Stack>
              )}
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  )
}

