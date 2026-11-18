import { useEffect, useMemo, useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'
import useFetch from '../hooks/useFetch.js'
import { idOf, toList } from '../utils/helpers.js'
import ImageUpload from './ImageUpload.jsx'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  Modal,
  Notice,
  PageHeader,
  SearchInput,
  SelectInput,
  TextArea,
  TextInput,
} from './ui.jsx'

function initialForm(fields, row) {
  const form = {}
  for (const f of fields) {
    if (f.type === 'image') {
      form[f.urlKey] = row?.[f.urlKey] ?? ''
      form[f.idKey] = row?.[f.idKey] ?? ''
    } else if (f.type === 'multiselect') {
      form[f.key] = (row?.[f.key] ?? []).map(idOf)
    } else {
      form[f.key] = row ? idOf(row[f.key]) : (f.default ?? '')
    }
  }
  return form
}

function buildPayload(fields, form, editing) {
  const payload = {}
  for (const f of fields) {
    if (f.showIf && !f.showIf(form)) continue
    if (f.type === 'image') {
      // send the image only when a new one was uploaded
      if (form[f.idKey] && form[f.idKey] !== (editing?.[f.idKey] ?? '')) {
        payload[f.urlKey] = form[f.urlKey]
        payload[f.idKey] = form[f.idKey]
      }
    } else if (f.type === 'multiselect') {
      payload[f.key] = form[f.key]
    } else if (form[f.key] !== '' && form[f.key] != null) {
      payload[f.key] = f.type === 'number' ? Number(form[f.key]) : form[f.key]
    }
  }
  return payload
}

function ResourcePage({
  title,
  endpoint,
  columns,
  fields,
  filterKey,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  addLabel = 'Add new',
}) {
  const { data, loading, error, reload } = useFetch(endpoint)
  const rows = useMemo(() => toList(data), [data])
  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState({ type: 'success', text: '' })
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [options, setOptions] = useState({})

  useEffect(() => {
    let active = true
    fields.forEach(async (f) => {
      if (!f.loadOptions) return
      try {
        const list = await f.loadOptions()
        if (active) setOptions((o) => ({ ...o, [f.key]: list }))
      } catch {
        // the select stays empty if its list cannot be loaded
      }
    })
    return () => {
      active = false
    }
  }, [fields])

  const filterValues = useMemo(
    () => (filterKey ? [...new Set(rows.map((r) => r[filterKey]).filter(Boolean))] : []),
    [rows, filterKey],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!filterValue || String(r[filterKey]) === filterValue) &&
        (!q || JSON.stringify(r).toLowerCase().includes(q)),
    )
  }, [rows, search, filterValue, filterKey])

  function openForm(row) {
    setEditing(row)
    setForm(initialForm(fields, row))
    setFormError('')
    setOpen(true)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = buildPayload(fields, form, editing)
      if (editing) await api.put(`${endpoint}/${editing._id}`, payload)
      else await api.post(endpoint, payload)
      setOpen(false)
      setMessage({ type: 'success', text: editing ? 'Updated successfully' : 'Created successfully' })
      reload()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api.delete(`${endpoint}/${toDelete._id}`)
      setMessage({ type: 'success', text: 'Deleted successfully' })
      reload()
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Delete failed') })
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const allColumns = [
    ...columns,
    ...(canEdit || canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="secondary" className="!px-3 !py-1" onClick={() => openForm(row)}>
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" className="!px-3 !py-1" onClick={() => setToDelete(row)}>
                    Delete
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ]

  function renderField(f) {
    if (f.showIf && !f.showIf(form)) return null
    if (f.type === 'image') {
      return (
        <ImageUpload
          key={f.urlKey}
          label={f.label}
          value={form[f.urlKey]}
          onUploaded={({ url, fileId }) =>
            setForm((s) => ({ ...s, [f.urlKey]: url, [f.idKey]: fileId }))
          }
        />
      )
    }
    const opts = f.options ?? options[f.key] ?? []
    const set = (value) => setForm((s) => ({ ...s, [f.key]: value }))
    let input
    if (f.type === 'textarea') {
      input = <TextArea value={form[f.key]} onChange={(e) => set(e.target.value)} required={f.required} />
    } else if (f.type === 'select') {
      input = (
        <SelectInput value={form[f.key]} onChange={(e) => set(e.target.value)} required={f.required}>
          <option value="">Select…</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectInput>
      )
    } else if (f.type === 'multiselect') {
      input = (
        <SelectInput
          multiple
          size={4}
          value={form[f.key]}
          onChange={(e) => set(Array.from(e.target.selectedOptions, (o) => o.value))}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectInput>
      )
    } else {
      input = (
        <TextInput
          type={f.type ?? 'text'}
          value={form[f.key]}
          onChange={(e) => set(e.target.value)}
          required={f.type === 'password' ? !editing : f.required}
          minLength={f.type === 'password' ? 6 : undefined}
          min={f.type === 'number' ? 0 : undefined}
        />
      )
    }
    return (
      <Field key={f.key} label={f.label}>
        {input}
      </Field>
    )
  }

  return (
    <div>
      <PageHeader
        title={title}
        action={canCreate && <Button onClick={() => openForm(null)}>{addLabel}</Button>}
      />
      <Notice>{error}</Notice>
      <Notice type={message.type}>{message.text}</Notice>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        {filterKey && (
          <SelectInput
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={{ maxWidth: '12rem' }}
          >
            <option value="">All</option>
            {filterValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </SelectInput>
        )}
      </div>

      <DataTable columns={allColumns} rows={visible} loading={loading} />

      <Modal open={open} title={editing ? 'Edit record' : addLabel} onClose={() => setOpen(false)}>
        <form onSubmit={save}>
          <Notice>{formError}</Notice>
          {fields.map(renderField)}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete record"
        message={`Delete "${toDelete?.name ?? 'this record'}"? This cannot be undone.`}
        confirmText="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

export default ResourcePage