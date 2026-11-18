import { useState } from 'react'
import { DataTable, Notice, PageHeader, SearchInput, SelectInput, StatusBadge } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatDate, toList } from '../utils/helpers.js'

const columns = [
  { key: 'date', header: 'Date', render: (r) => formatDate(r.date ?? r.createdAt) },
  { key: 'product', header: 'Product', render: (r) => r.product?.name ?? '—' },
  { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name ?? '—' },
  { key: 'transactionType', header: 'Type', render: (r) => <StatusBadge status={r.transactionType} /> },
  { key: 'quantity', header: 'Quantity' },
  { key: 'performedBy', header: 'By', render: (r) => r.performedBy?.name ?? '—' },
  { key: 'note', header: 'Note' },
]

function TransactionsView() {
  const { data, loading, error } = useFetch('/api/transactions')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const rows = toList(data).filter(
    (r) =>
      (!type || r.transactionType === type) &&
      (!q || `${r.product?.name} ${r.product?.sku} ${r.warehouse?.name}`.toLowerCase().includes(q)),
  )

  return (
    <div>
      <PageHeader title="Stock Transactions" />
      <Notice>{error}</Notice>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: '12rem' }}>
          <option value="">All types</option>
          <option value="stock-in">Stock in</option>
          <option value="stock-out">Stock out</option>
        </SelectInput>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} />
    </div>
  )
}

export default TransactionsView