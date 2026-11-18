import { useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'
import { Button, Field, Notice, PageHeader, SelectInput, TextInput } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { idOf, toList } from '../utils/helpers.js'

function StockMoveView({ type }) {
  const isIn = type === 'in'
  const products = useFetch('/api/products')
  const warehouses = useFetch('/api/warehouses')
  const stock = useFetch('/api/stock')
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: 'success', text: '' })

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))
  const available =
    toList(stock.data).find(
      (s) => idOf(s.product) === form.productId && idOf(s.warehouse) === form.warehouseId,
    )?.quantity ?? 0

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage({ type: 'success', text: '' })
    try {
      await api.post(`/api/stock/${type}`, {
        productId: form.productId,
        warehouseId: form.warehouseId,
        quantity: Number(form.quantity),
        note: form.note,
      })
      setMessage({ type: 'success', text: isIn ? 'Stock added successfully' : 'Stock removed successfully' })
      setForm((s) => ({ ...s, quantity: '', note: '' }))
      stock.reload()
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Request failed') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title={isIn ? 'Stock In (Receive Stock)' : 'Stock Out (Remove Stock)'} />
      <form onSubmit={submit} className="max-w-lg rounded-xl border border-slate-200 bg-brand-surface p-6">
        <Notice type={message.type}>{message.text}</Notice>
        <Field label="Warehouse">
          <SelectInput value={form.warehouseId} onChange={set('warehouseId')} required>
            <option value="">Select warehouse…</option>
            {toList(warehouses.data).map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Product">
          <SelectInput value={form.productId} onChange={set('productId')} required>
            <option value="">Select product…</option>
            {toList(products.data).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </SelectInput>
        </Field>
        {form.productId && form.warehouseId && (
          <p className="-mt-2 mb-4 text-sm text-slate-500">Currently available: {available}</p>
        )}
        <Field label="Quantity">
          <TextInput type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} required />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={form.note} onChange={set('note')} />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isIn ? 'Add stock' : 'Remove stock'}
        </Button>
      </form>
    </div>
  )
}

export default StockMoveView