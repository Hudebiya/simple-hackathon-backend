import { useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'
import { Button, DataTable, Notice, PageHeader, StatusBadge } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatDate, toList } from '../utils/helpers.js'

function SupplyRequestsView({
  canReview = false,
  showSupplier = false,
  emptyMessage = 'No supply requests found.',
}) {
  const { data, loading, error, reload } = useFetch('/api/supply-requests')
  const [message, setMessage] = useState({ type: 'success', text: '' })

  async function review(id, status) {
    setMessage({ type: 'success', text: '' })
    try {
      await api.put(`/api/supply-requests/${id}/status`, { status })
      setMessage({ type: 'success', text: `Request ${status.toLowerCase()}` })
      reload()
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Action failed') })
    }
  }

  const columns = [
    { key: 'createdAt', header: 'Date', render: (r) => formatDate(r.createdAt) },
    ...(showSupplier ? [{ key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name ?? '—' }] : []),
    { key: 'product', header: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name ?? '—' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'reviewedBy', header: 'Reviewed by', render: (r) => r.reviewedBy?.name ?? '—' },
    ...(canReview
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (r) =>
              r.status === 'Pending' ? (
                <div className="flex gap-2">
                  <Button className="!px-3 !py-1" onClick={() => review(r._id, 'Approved')}>
                    Approve
                  </Button>
                  <Button variant="danger" className="!px-3 !py-1" onClick={() => review(r._id, 'Rejected')}>
                    Reject
                  </Button>
                </div>
              ) : (
                '—'
              ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader title="Supply Requests" />
      <Notice>{error}</Notice>
      <Notice type={message.type}>{message.text}</Notice>
      <DataTable columns={columns} rows={toList(data)} loading={loading} empty={emptyMessage} />
    </div>
  )
}

export default SupplyRequestsView