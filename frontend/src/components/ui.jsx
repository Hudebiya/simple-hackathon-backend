import { useEffect } from 'react'

const BADGES = {
  Pending: 'bg-amber-100 text-amber-800',
  Processing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Approved: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Rejected: 'bg-red-100 text-red-800',
  'stock-in': 'bg-green-100 text-green-800',
  'stock-out': 'bg-orange-100 text-orange-800',
}

const BUTTONS = {
  primary: 'bg-brand-primary text-white hover:brightness-110',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-primary focus:outline-2 focus:outline-brand-primary/30'

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTONS[variant]} ${className}`}
    />
  )
}

export function PageHeader({ title, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {action}
    </div>
  )
}

export function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-brand-surface p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-primary">{value ?? '—'}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[status] || 'bg-slate-100 text-slate-700'}`}
    >
      {status}
    </span>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-brand-primary" role="status">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary/25 border-t-brand-primary"
      />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

export function Notice({ type = 'error', children }) {
  if (!children) return null
  const style =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-800'
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${style}`} role="alert">
      {children}
    </div>
  )
}

export function DataTable({ columns, rows, loading, empty = 'No records found' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-brand-surface">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-semibold">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <Spinner />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row._id ?? i} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle">
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-brand-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props) {
  return <input {...props} className={FIELD} />
}

export function TextArea(props) {
  return <textarea rows={3} {...props} className={FIELD} />
}

export function SelectInput({ children, ...props }) {
  return (
    <select {...props} className={FIELD}>
      {children}
    </select>
  )
}

export function SearchInput(props) {
  return <input type="search" placeholder="Search…" {...props} className={`${FIELD} sm:max-w-xs`} />
}