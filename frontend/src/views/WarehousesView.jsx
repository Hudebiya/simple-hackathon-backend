import { DataTable, Notice, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { toList } from '../utils/helpers.js'

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'location', header: 'Location' },
  { key: 'capacity', header: 'Capacity' },
  { key: 'manager', header: 'Manager', render: (r) => r.manager?.name ?? '—' },
]

function WarehousesView() {
  const { data, loading, error } = useFetch('/api/warehouses')
  return (
    <div>
      <PageHeader title="My Warehouses" />
      <Notice>{error}</Notice>
      <DataTable columns={columns} rows={toList(data)} loading={loading} />
    </div>
  )
}

export default WarehousesView