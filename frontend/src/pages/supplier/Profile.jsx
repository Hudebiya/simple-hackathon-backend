import { useState } from 'react'
import api, { getApiErrorMessage } from '../../api/axios.js'
import ImageUpload from '../../components/ImageUpload.jsx'
import { Button, Field, Notice, PageHeader, TextInput } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    image: user.image ?? '',
    imageFileId: '',
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: 'success', text: '' })

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setMessage({ type: 'success', text: '' })
    try {
      const payload = { name: form.name, phone: form.phone }
      if (form.imageFileId) {
        payload.image = form.image
        payload.imageFileId = form.imageFileId
      }
      await api.put(`/api/users/${user.id}`, payload)
      const { data } = await api.get('/api/auth/me')
      setUser(data.user)
      setForm((f) => ({ ...f, imageFileId: '' }))
      setMessage({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Could not update profile') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" />
      <form onSubmit={save} className="max-w-lg rounded-xl border border-slate-200 bg-brand-surface p-6">
        <Notice type={message.type}>{message.text}</Notice>
        <ImageUpload
          label="Logo / profile image"
          value={form.image}
          onUploaded={({ url, fileId }) => setForm((f) => ({ ...f, image: url, imageFileId: fileId }))}
        />
        <Field label="Name">
          <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
        <Field label="Email">
          <TextInput value={user.email ?? ''} disabled />
        </Field>
        <Field label="Phone">
          <TextInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </div>
  )
}