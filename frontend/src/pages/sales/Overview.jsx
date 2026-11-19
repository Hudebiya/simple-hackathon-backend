import { Notice, PageHeader, Spinner, StatCard } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { toList } from '../../utils/helpers.js'

export default function SalesOverview() {
  const { data, loading, error } = useFetch('/api/orders')
  const orders = toList(data)
  const count = (status) => orders.filter((o) => o.status === status).length

  return (
    <div>
      <PageHeader title="Overview" />
      <Notice>{error}</Notice>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="My orders" value={orders.length} />
          <StatCard label="Pending" value={count('Pending')} />
          <StatCard label="Processing" value={count('Processing')} />
          <StatCard label="Completed" value={count('Completed')} />
          <StatCard label="Cancelled" value={count('Cancelled')} />
        </div>
      )}
    </div>
  )
}