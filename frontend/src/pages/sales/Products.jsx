import { useMemo, useState } from 'react'
import { Button, Modal, Notice, PageHeader, SearchInput, SelectInput, Spinner } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { formatMoney, idOf, toList } from '../../utils/helpers.js'

export default function SalesProducts() {
  const products = useFetch('/api/products')
  const stock = useFetch('/api/stock')
  const warehouses = useFetch('/api/warehouses')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [selected, setSelected] = useState(null)

  const available = useMemo(() => {
    const map = {}
    toList(stock.data).forEach((s) => {
      if (warehouse && idOf(s.warehouse) !== warehouse) return
      const id = idOf(s.product)
      map[id] = (map[id] ?? 0) + (s.quantity || 0)
    })
    return map
  }, [stock.data, warehouse])

  const list = toList(products.data)
  const categories = [...new Set(list.map((p) => p.category).filter(Boolean))]
  const q = search.trim().toLowerCase()
  const rows = list.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)),
  )

  return (
    <div>
      <PageHeader title="Products" />
      <Notice>{products.error || stock.error || warehouses.error}</Notice>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: '12rem' }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={warehouse} onChange={(e) => setWarehouse(e.target.value)} style={{ maxWidth: '14rem' }}>
          <option value="">All warehouses</option>
          {toList(warehouses.data).map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </SelectInput>
      </div>

      {products.loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-slate-500">No products found</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const qty = available[p._id] ?? 0
            return (
              <div key={p._id} className="rounded-xl border border-slate-200 bg-brand-surface p-4 shadow-sm">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-36 w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                    No image
                  </div>
                )}
                <h3 className="mt-3 font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500">
                  {p.sku} · {p.category}
                </p>
                <p className="mt-2 font-semibold text-brand-primary">{formatMoney(p.price)}</p>
                <p className={`text-sm ${qty > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                </p>
                <Button variant="secondary" className="mt-3 w-full" onClick={() => setSelected(p)}>
                  View details
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={Boolean(selected)} title={selected?.name} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-2 text-sm text-slate-700">
            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.name} className="mb-3 h-48 w-full rounded-lg object-cover" />
            )}
            <p><b>SKU:</b> {selected.sku}</p>
            <p><b>Category:</b> {selected.category}</p>
            <p><b>Price:</b> {formatMoney(selected.price)}</p>
            <p><b>Supplier:</b> {selected.supplier?.name ?? '—'}</p>
            <p><b>Available:</b> {available[selected._id] ?? 0}</p>
            {selected.description && <p>{selected.description}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}