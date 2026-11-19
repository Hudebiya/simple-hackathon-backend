import { Notice, PageHeader, Spinner, StatCard } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { toList } from '../../utils/helpers.js'

export default function SupplierOverview() {
  const products = useFetch('/api/products')
  const requests = useFetch('/api/supply-requests')
  const list = toList(requests.data)
  const count = (status) => list.filter((r) => r.status === status).length

  return (
    <div>
      <PageHeader title="Overview" />
      <Notice>{products.error || requests.error}</Notice>
      {products.loading || requests.loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="My products" value={toList(products.data).length} />
          <StatCard label="Pending requests" value={count('Pending')} />
          <StatCard label="Approved requests" value={count('Approved')} />
          <StatCard label="Rejected requests" value={count('Rejected')} />
        </div>
      )}
    </div>
  )
}