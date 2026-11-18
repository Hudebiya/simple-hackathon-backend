import ResourcePage from '../../components/ResourcePage.jsx'
import { optionsFrom } from '../../utils/options.js'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'warehouseManager', label: 'Warehouse Manager' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'salesRepresentative', label: 'Sales Representative' },
]

const fields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'password', label: 'Password (min 6 characters)', type: 'password' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role', type: 'select', options: ROLES, required: true },
  {
    key: 'assignedWarehouses',
    label: 'Assigned warehouses',
    type: 'multiselect',
    loadOptions: optionsFrom('/api/warehouses'),
    showIf: (form) => form.role === 'warehouseManager',
  },
  { type: 'image', label: 'Profile image', urlKey: 'image', idKey: 'imageFileId' },
]

const columns = [
  {
    key: 'image',
    header: 'Image',
    render: (r) =>
      r.image ? (
        <img src={r.image} alt="" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
      ) : (
        '—'
      ),
  },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  { key: 'phone', header: 'Phone' },
]

export default function Users() {
  return (
    <ResourcePage
      title="Users"
      endpoint="/api/users"
      columns={columns}
      fields={fields}
      filterKey="role"
      addLabel="Add user"
    />
  )
}