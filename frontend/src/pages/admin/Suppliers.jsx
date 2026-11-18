import { useMemo } from 'react'
import { DataTable, Notice, PageHeader } from '../../components/ui.jsx'
import useFetch from '../../hooks/useFetch.js'
import { idOf, toList } from '../../utils/helpers.js'

export default function Suppliers() {
  const users = useFetch('/api/users', { role: 'supplier' })
  const products = useFetch('/api/products')

  const counts = useMemo(() => {
    const map = {}
    toList(products.data).forEach((p) => {
      const id = idOf(p.supplier)
      map[id] = (map[id] ?? 0) + 1
    })
    return map
  }, [products.data])

  const rows = toList(users.data).filter((u) => u.role === 'supplier')

  const columns = [
    {
      key: 'image',
      header: 'Logo',
      render: (r) =>
        r.image ? (
          <img src={r.image} alt="" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
        ) : (
          '—'
        ),
    },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'count', header: 'Products', render: (r) => counts[r._id] ?? 0 },
  ]

  return (
    <div>
      <PageHeader title="Suppliers" />
      <Notice>{users.error}</Notice>
      <DataTable columns={columns} rows={rows} loading={users.loading} />
    </div>
  )
}