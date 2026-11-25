import { useState } from 'react'
import { DataTable, Notice, PageHeader, SearchInput, SelectInput } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { idOf, toList } from '../utils/helpers.js'

function StockView({ title, url = '/api/stock' }) {
  const stock = useFetch(url)
  const warehouses = useFetch('/api/warehouses')
  const [warehouse, setWarehouse] = useState('')
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  const rows = toList(stock.data).filter(
    (r) =>
      (!warehouse || idOf(r.warehouse) === warehouse) &&
      (!q || `${r.product?.name} ${r.product?.sku}`.toLowerCase().includes(q)),
  )

  const columns = [
    {
      key: 'image',
      header: 'Image',
      render: (r) =>
        r.product?.imageUrl ? (
          <img src={r.product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
        ) : (
          '—'
        ),
    },
    { key: 'product', header: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'sku', header: 'SKU', render: (r) => r.product?.sku ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name ?? '—' },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => {
        const low = r.product?.lowStockLimit != null && r.quantity <= r.product.lowStockLimit
        return (
          <span className={low ? 'font-bold text-red-600 dark:text-red-400' : 'font-semibold'}>
            {r.quantity}
            {low ? ' (low)' : ''}
          </span>
        )
      },
    },
    { key: 'limit', header: 'Low-stock limit', render: (r) => r.product?.lowStockLimit ?? '—' },
  ]

  return (
    <div>
      <PageHeader title={title} />
      <Notice>{stock.error}</Notice>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={warehouse} onChange={(e) => setWarehouse(e.target.value)} style={{ maxWidth: '14rem' }}>
          <option value="">All warehouses</option>
          {toList(warehouses.data).map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </SelectInput>
      </div>
      <DataTable columns={columns} rows={rows} loading={stock.loading} />
    </div>
  )
}

export default StockView