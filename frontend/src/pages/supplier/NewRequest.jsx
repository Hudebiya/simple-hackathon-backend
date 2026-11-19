import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../../api/axios.js'
import { Button, Field, Notice, PageHeader, SelectInput, TextInput } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { toList } from '../../utils/helpers.js'

export default function NewRequest() {
  const navigate = useNavigate()
  const products = useFetch('/api/products')
  const warehouses = useFetch('/api/warehouses')
  const [form, setForm] = useState({ product: '', warehouse: '', quantity: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

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
        <Notice>{error || warehouses.error || products.error}</Notice>
        <Field label="Product">
          <SelectInput value={form.product} onChange={set('product')} required>
            <option value="">Select product…</option>
            {toList(products.data).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Warehouse">
          <SelectInput value={form.warehouse} onChange={set('warehouse')} required>
            <option value="">Select warehouse…</option>
            {toList(warehouses.data).map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Quantity">
          <TextInput type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} required />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={form.note} onChange={set('note')} />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit request'}
        </Button>
      </form>
    </div>
  )
}