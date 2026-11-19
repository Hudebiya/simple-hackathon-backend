import ResourcePage from '../../components/ResourcePage.jsx'
import { formatMoney } from '../../utils/helpers.js'

const fields = []

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
]

export default function SupplierProducts() {
  return (
    <ResourcePage
      title="My Products"
      endpoint="/api/products"
      columns={columns}
      fields={fields}
      filterKey="category"
      canCreate={false}
      canEdit={false}
      canDelete={false}
    />
  )
}