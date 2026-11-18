import { Notice, PageHeader, Spinner, StatCard } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { toList } from '../../utils/helpers.js'

export default function ManagerOverview() {
  const warehouses = useFetch('/api/warehouses')
  const stock = useFetch('/api/stock')
  const low = useFetch('/api/stock/low')
  const loading = warehouses.loading || stock.loading || low.loading
  const stockRows = toList(stock.data)
  const units = stockRows.reduce((sum, s) => sum + (s.quantity || 0), 0)

  return (
    <div>
      <PageHeader title="Overview" />
      <Notice>{warehouses.error || stock.error || low.error}</Notice>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned warehouses" value={toList(warehouses.data).length} />
          <StatCard label="Stock records" value={stockRows.length} />
          <StatCard label="Total units" value={units} />
          <StatCard label="Low-stock items" value={toList(low.data).length} />
        </div>
      )}
    </div>
  )
}