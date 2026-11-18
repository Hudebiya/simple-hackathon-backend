import ResourcePage from '../../components/ResourcePage.jsx'
import { optionsFrom } from '../../utils/options.js'

const fields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'location', label: 'Location', required: true },
  { key: 'capacity', label: 'Capacity', type: 'number' },
  {
    key: 'manager',
    label: 'Manager',
    type: 'select',
    loadOptions: optionsFrom('/api/users', { role: 'warehouseManager' }, (u) => `${u.name} (${u.email})`),
  },
]

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'location', header: 'Location' },
  { key: 'capacity', header: 'Capacity' },
  { key: 'manager', header: 'Manager', render: (r) => r.manager?.name ?? '—' },
]

export default function Warehouses() {
  return (
    <ResourcePage
      title="Warehouses"
      endpoint="/api/warehouses"
      columns={columns}
      fields={fields}
      addLabel="Add warehouse"
    />
  )
}