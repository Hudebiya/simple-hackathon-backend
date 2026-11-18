import { Notice, PageHeader, Spinner, StatCard } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { humanize } from '../../utils/helpers.js'

function numbers(obj, out = []) {
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (typeof value === 'number') out.push([key, value])
    else if (value && typeof value === 'object' && !Array.isArray(value)) numbers(value, out)
  })
  return out
}

export default function AdminOverview() {
  const { data, loading, error } = useFetch('/api/stats')
  return (
    <div>
      <PageHeader title="Overview" />
      <Notice>{error}</Notice>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {numbers(data).map(([key, value]) => (
            <StatCard key={key} label={humanize(key)} value={value} />
          ))}
        </div>
      )}
    </div>
  )
}