import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiErrorMessage } from '../../api/axios.js'
import { Button, ConfirmDialog, DataTable, Notice, PageHeader, StatusBadge } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { formatDate, formatMoney, toList } from '../../utils/helpers.js'

export default function SalesOrders() {
  const { data, loading, error, reload } = useFetch('/api/orders')
  const [toCancel, setToCancel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: 'success', text: '' })

  async function cancelOrder() {
    setBusy(true)
    try {
      await api.put(`/api/orders/${toCancel._id}/cancel`)
      setMessage({ type: 'success', text: `Order ${toCancel.orderNumber} cancelled` })
      reload()
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Could not cancel order') })
    } finally {
      setBusy(false)
      setToCancel(null)
    }
  }

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customerName', header: 'Customer' },
    { key: 'totalAmount', header: 'Total', render: (o) => formatMoney(o.totalAmount) },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'createdAt', header: 'Date', render: (o) => formatDate(o.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (o) => (
        <div className="flex gap-2">
          <Link
            to={`/sales/orders/${o._id}`}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Details
          </Link>
          {o.status === 'Pending' && (
            <Button variant="danger" className="!px-3 !py-1" onClick={() => setToCancel(o)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="My Orders" />
      <Notice>{error}</Notice>
      <Notice type={message.type}>{message.text}</Notice>
      <DataTable columns={columns} rows={toList(data)} loading={loading} />
      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel order"
        message={`Cancel order ${toCancel?.orderNumber}? Only pending orders can be cancelled.`}
        confirmText="Yes, cancel"
        busy={busy}
        onConfirm={cancelOrder}
        onCancel={() => setToCancel(null)}
      />
    </div>
  )
}