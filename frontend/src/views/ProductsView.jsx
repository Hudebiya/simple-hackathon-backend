import api from '../api/axios.js'
import ResourcePage from '../components/ResourcePage.jsx'
import { formatMoney, toList } from '../utils/helpers.js'
import { optionsFrom } from '../utils/options.js'

// Managers cannot list users, so their supplier list comes from the existing products
async function suppliersFromProducts() {
  const { data } = await api.get('/api/products')
  const map = new Map()
  toList(data).forEach((p) => {
    if (p.supplier?._id) map.set(p.supplier._id, { value: p.supplier._id, label: p.supplier.name })
  })
  return [...map.values()]
}

function makeFields(loadSuppliers) {
  return [
    { key: 'name', label: 'Name', required: true },
    { key: 'sku', label: 'SKU', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'lowStockLimit', label: 'Low-stock limit', type: 'number', required: true },
    { key: 'supplier', label: 'Supplier', type: 'select', required: true, loadOptions: loadSuppliers },
    { key: 'description', label: 'Description', type: 'textarea' },
    { type: 'image', label: 'Product image', urlKey: 'imageUrl', idKey: 'imageFileId' },
  ]
}

const adminFields = makeFields(
  optionsFrom('/api/users', { role: 'supplier' }, (u) => `${u.name} (${u.email})`),
)
const managerFields = makeFields(suppliersFromProducts)

const columns = [
  {
    key: 'imageUrl',
    header: 'Image',
    render: (r) =>
      r.imageUrl ? (
        <img src={r.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
      ) : (
        '—'
      ),
  },
  { key: 'name', header: 'Name' },
  { key: 'sku', header: 'SKU' },
  { key: 'category', header: 'Category' },
  { key: 'price', header: 'Price', render: (r) => formatMoney(r.price) },
  { key: 'lowStockLimit', header: 'Low-stock limit' },
  { key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name ?? '—' },
]

function ProductsView({ isAdmin = false }) {
  return (
    <ResourcePage
      title="Products"
      endpoint="/api/products"
      columns={columns}
      fields={isAdmin ? adminFields : managerFields}
      filterKey="category"
      canDelete={isAdmin}
      addLabel="Add product"
    />
  )
}

export default ProductsView