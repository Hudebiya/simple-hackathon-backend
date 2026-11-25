import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../../api/axios.js'
import { Button, Field, Notice, PageHeader, SelectInput, TextInput } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { formatMoney, idOf, toList } from '../../utils/helpers.js'

export default function NewOrder() {
  const navigate = useNavigate()
  const products = useFetch('/api/products')
  const warehouses = useFetch('/api/warehouses')
  const stock = useFetch('/api/stock')
  const [customer, setCustomer] = useState({ customerName: '', customerPhone: '' })
  const [warehouse, setWarehouse] = useState('')
  const [rows, setRows] = useState([{ product: '', quantity: 1 }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const productList = toList(products.data)
  const warehouseList = toList(warehouses.data)
  const stockList = toList(stock.data)
  const stockByWarehouse = new Map()
  stockList.forEach((item) => {
    const warehouseId = idOf(item.warehouse)
    const quantity = Number(item.quantity) || 0
    if (warehouseId && quantity > 0) {
      stockByWarehouse.set(warehouseId, (stockByWarehouse.get(warehouseId) ?? 0) + quantity)
    }
  })
  const stockedWarehouses = warehouseList.filter((item) => stockByWarehouse.has(item._id))
  const loading = products.loading || warehouses.loading || stock.loading
  const fetchError = products.error || warehouses.error || stock.error
  const priceOf = (id) => productList.find((p) => p._id === id)?.price ?? 0
  const availableOf = (id) =>
    toList(stock.data).find((s) => idOf(s.product) === id && idOf(s.warehouse) === warehouse)?.quantity ?? 0

  const total = rows.reduce((sum, r) => sum + priceOf(r.product) * (Number(r.quantity) || 0), 0)

  function updateRow(index, patch) {
    setRows((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const items = rows
      .filter((r) => r.product)
      .map((r) => ({ product: r.product, quantity: Number(r.quantity) }))
    if (items.length === 0) {
      setError('Add at least one product')
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post('/api/orders', { ...customer, warehouse, products: items })
      const id = data.order?._id ?? data._id
      navigate(id ? `/sales/orders/${id}` : '/sales/orders')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create order'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Create Sales Order" />
      <form onSubmit={submit} className="max-w-3xl rounded-xl border border-slate-200 bg-brand-surface p-6">
        <Notice>{error || fetchError}</Notice>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Customer name">
            <TextInput
              value={customer.customerName}
              onChange={(e) => setCustomer((c) => ({ ...c, customerName: e.target.value }))}
              required
            />
          </Field>
          <Field label="Customer phone">
            <TextInput
              value={customer.customerPhone}
              onChange={(e) => setCustomer((c) => ({ ...c, customerPhone: e.target.value }))}
              required
            />
          </Field>
        </div>
        <Field label="Warehouse">
          <SelectInput value={warehouse} onChange={(e) => setWarehouse(e.target.value)} required>
            <option value="">Select warehouse…</option>
            {stockedWarehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} — {stockByWarehouse.get(w._id)} units available
              </option>
            ))}
          </SelectInput>
          {!loading && !fetchError && stockedWarehouses.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">No warehouses currently have stock for any product.</p>
          )}
        </Field>

        <p className="mb-2 text-sm font-medium text-slate-700">Products</p>
        {!products.loading && !products.error && productList.length === 0 && (
          <p className="mb-3 text-sm text-slate-500">No products are available to order.</p>
        )}
        {rows.map((row, index) => {
          const available = row.product && warehouse ? availableOf(row.product) : null
          return (
            <div key={index} className="mb-3 flex flex-wrap items-start gap-3">
              <div className="min-w-[12rem] flex-1">
                <SelectInput value={row.product} onChange={(e) => updateRow(index, { product: e.target.value })} required>
                  <option value="">Select product…</option>
                  {productList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {formatMoney(p.price)}
                    </option>
                  ))}
                </SelectInput>
                {available !== null && (
                  <p className={`mt-1 text-xs ${available >= Number(row.quantity) ? 'text-slate-500' : 'text-red-600 dark:text-red-400'}`}>
                    Available: {available}
                  </p>
                )}
              </div>
              <div className="w-28">
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  required
                />
              </div>
              <p className="w-28 pt-2 text-sm font-semibold">{formatMoney(priceOf(row.product) * (Number(row.quantity) || 0))}</p>
              {rows.length > 1 && (
                <Button variant="secondary" onClick={() => setRows((list) => list.filter((_, i) => i !== index))}>
                  Remove
                </Button>
              )}
            </div>
          )
        })}
        <Button variant="secondary" onClick={() => setRows((list) => [...list, { product: '', quantity: 1 }])}>
          + Add product
        </Button>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-lg font-bold">Total: {formatMoney(total)}</p>
          <Button
            type="submit"
            disabled={busy || loading || Boolean(fetchError) || !productList.length || !stockedWarehouses.length}
          >
            {busy ? 'Creating…' : 'Create order'}
          </Button>
        </div>
      </form>
    </div>
  )
}