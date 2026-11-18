import { useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'
import { Button, ConfirmDialog, DataTable, Notice, PageHeader, SearchInput, SelectInput, StatusBadge } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatDate, formatMoney, toList } from '../utils/helpers.js'

const NEXT = { Pending: 'Processing', Processing: 'Completed' }
const LABEL = { Processing: 'Process', Completed: 'Complete', Cancelled: 'Cancel' }

function OrdersView() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useFetch('/api/orders')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: 'success', text: '' })

  const q = search.trim().toLowerCase()
  const rows = toList(data).filter(
    (o) =>
      (!status || o.status === status) &&
      (!q || `${o.orderNumber} ${o.customerName}`.toLowerCase().includes(q)),
  )

  async function run() {
    setBusy(true)
    setMessage({ type: 'success', text: '' })
    try {
      const { order, next } = action
      if (next === 'Cancelled') await api.put(`/api/orders/${order._id}/cancel`)
      else await api.put(`/api/orders/${order._id}/status`, { status: next })
      setMessage({ type: 'success', text: `Order ${order.orderNumber} is now ${next}` })
      reload()
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Action failed') })
    } finally {
      setBusy(false)
      setAction(null)
    }
  }

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customerName', header: 'Customer' },
    { key: 'warehouse', header: 'Warehouse', render: (o) => o.warehouse?.name ?? '—' },
    {
      key: 'products',
      header: 'Items',
      render: (o) => o.products?.map((i) => `${i.product?.name ?? 'Item'} ×${i.quantity}`).join(', '),
    },
    { key: 'totalAmount', header: 'Total', render: (o) => formatMoney(o.totalAmount) },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'createdAt', header: 'Date', render: (o) => formatDate(o.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (o) => (
        <div className="flex gap-2">
          {NEXT[o.status] && (
            <Button className="!px-3 !py-1" onClick={() => setAction({ order: o, next: NEXT[o.status] })}>
              {LABEL[NEXT[o.status]]}
            </Button>
          )}
          {user.role === 'admin' && o.status === 'Pending' && (
            <Button variant="danger" className="!px-3 !py-1" onClick={() => setAction({ order: o, next: 'Cancelled' })}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Orders" />
      <Notice>{error}</Notice>
      <Notice type={message.type}>{message.text}</Notice>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: '12rem' }}>
          <option value="">All statuses</option>
          {['Pending', 'Processing', 'Completed', 'Cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} />
      <ConfirmDialog
        open={Boolean(action)}
        title="Update order"
        message={action ? `Change order ${action.order.orderNumber} to "${action.next}"?` : ''}
        confirmText="Yes, continue"
        busy={busy}
        onConfirm={run}
        onCancel={() => setAction(null)}
      />
    </div>
  )
}

export default OrdersView