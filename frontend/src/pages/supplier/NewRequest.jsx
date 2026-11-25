import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../../api/axios.js'
import { Button, Field, Notice, PageHeader, SelectInput, TextInput } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { toList } from '../../utils/helpers.js'

export default function NewRequest() {
  const navigate = useNavigate()
  const products = useFetch('/api/products')
  const warehouses = useFetch('/api/supply-requests/warehouses')
  const [form, setForm] = useState({ product: '', warehouse: '', quantity: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))
  const productList = toList(products.data)
  const warehouseList = toList(warehouses.data)
  const loading = products.loading || warehouses.loading
  const fetchError = products.error || warehouses.error

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/api/supply-requests', { ...form, quantity: Number(form.quantity) })
      navigate('/supplier/requests')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit request'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Submit Supply Request" />
      <form onSubmit={submit} className="max-w-lg rounded-xl border border-slate-200 bg-brand-surface p-6">
        <Notice>{error || fetchError}</Notice>
        <Field label="Product">
          <SelectInput value={form.product} onChange={set('product')} required>
            <option value="">Select product…</option>
            {productList.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </SelectInput>
          {!products.loading && !products.error && productList.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">No products are available for your account.</p>
          )}
        </Field>
        <Field label="Warehouse">
          <SelectInput value={form.warehouse} onChange={set('warehouse')} required>
            <option value="">Select warehouse…</option>
            {warehouseList.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </SelectInput>
          {!warehouses.loading && !warehouses.error && warehouseList.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">No warehouses are available.</p>
          )}
        </Field>
        <Field label="Quantity">
          <TextInput type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} required />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={form.note} onChange={set('note')} />
        </Field>
        <Button type="submit" disabled={busy || loading || Boolean(fetchError) || !productList.length || !warehouseList.length}>
          {busy ? 'Submitting…' : 'Submit request'}
        </Button>
      </form>
    </div>
  )
}