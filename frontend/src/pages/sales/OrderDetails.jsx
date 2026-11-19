import { Link, useParams } from 'react-router-dom'
import { DataTable, Notice, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { formatDate, formatMoney } from '../../utils/helpers.js'

export default function OrderDetails() {
  const { id } = useParams()
  const { data, loading, error } = useFetch(`/api/orders/${id}`)
  const order = data?.order ?? data

  const columns = [
    { key: 'product', header: 'Product', render: (i) => i.product?.name ?? '—' },
    { key: 'sku', header: 'SKU', render: (i) => i.product?.sku ?? '—' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'price', header: 'Unit price', render: (i) => formatMoney(i.price) },
    { key: 'line', header: 'Line total', render: (i) => formatMoney(i.price * i.quantity) },
  ]

  return (
    <div>
      <PageHeader
        title="Order Details"
        action={
          <Link to="/sales/orders" className="text-sm font-semibold text-brand-primary">
            ← Back to my orders
          </Link>
        }
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Spinner />
      ) : order ? (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-brand-surface p-5 text-sm sm:grid-cols-2">
            <p><b>Order #:</b> {order.orderNumber}</p>
            <p><b>Status:</b> <StatusBadge status={order.status} /></p>
            <p><b>Customer:</b> {order.customerName}</p>
            <p><b>Phone:</b> {order.customerPhone}</p>
            <p><b>Warehouse:</b> {order.warehouse?.name ?? '—'}</p>
            <p><b>Date:</b> {formatDate(order.createdAt)}</p>
          </div>
          <DataTable columns={columns} rows={order.products ?? []} />
          <p className="text-right text-lg font-bold">Grand total: {formatMoney(order.totalAmount)}</p>
        </div>
      ) : null}
    </div>
  )
}