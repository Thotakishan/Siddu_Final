import { ActionIcon, Group, Pagination, Skeleton, Table, Text } from '@mantine/core'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { type ReactNode } from 'react'
import { useMemo, useState } from 'react'

export type DataTableColumn<Row> = {
  key: string
  header: string
  sortable?: boolean
  render: (row: Row) => ReactNode
}

type SortDir = 'asc' | 'desc'

type Props<Row> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  loading?: boolean
  pageSize: number
  getRowId?: (row: Row) => string
}

function defaultRowId(row: unknown): string {
  if (row && typeof row === 'object' && 'id' in (row as Record<string, unknown>)) {
    const v = (row as Record<string, unknown>).id
    if (typeof v === 'string') return v
  }
  return crypto.randomUUID()
}

export function DataTable<Row>({ columns, rows, loading = false, pageSize, getRowId }: Props<Row>) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const dir = sort.dir
    // Sorting by rendered value is not ideal; we keep it generic by sorting on stringified render output.
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = String(col.render(a))
      const bv = String(col.render(b))
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
      return dir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = sorted.slice(start, start + pageSize)

  return (
    <>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => {
              const active = sort?.key === c.key
              const icon = active ? (sort?.dir === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />) : null
              return (
                <Table.Th key={c.key}>
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Text fw={600} size="sm">
                      {c.header}
                    </Text>
                    {c.sortable ? (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        aria-label={`Sort by ${c.header}`}
                        onClick={() => {
                          setPage(1)
                          setSort((prev) => {
                            if (!prev || prev.key !== c.key) return { key: c.key, dir: 'asc' }
                            return { key: c.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                          })
                        }}
                      >
                        {icon ?? <IconChevronUp size={16} opacity={0.35} />}
                      </ActionIcon>
                    ) : null}
                  </Group>
                </Table.Th>
              )
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
              <Table.Tr key={`sk_${i}`}>
                {columns.map((c) => (
                  <Table.Td key={c.key}>
                    <Skeleton h={14} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          ) : pageRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text size="sm" c="dimmed">
                  No results
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            pageRows.map((r) => (
              <Table.Tr key={(getRowId ?? defaultRowId)(r)}>
                {columns.map((c) => (
                  <Table.Td key={c.key}>{c.render(r)}</Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" mt="sm">
        <Text size="xs" c="dimmed">
          {loading ? 'Loading…' : `${sorted.length} items`}
        </Text>
        <Pagination total={totalPages} value={safePage} onChange={setPage} size="sm" />
      </Group>
    </>
  )
}

