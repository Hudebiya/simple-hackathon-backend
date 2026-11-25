import { useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

function ImageUpload({ value, onUploaded, label = 'Image' }) {
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(event) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setError('')

    if (!ALLOWED.includes(file.type)) {
      setError('Only JPG, PNG or WebP images are allowed')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be 2 MB or smaller')
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { data } = await api.get('/api/upload/auth')
      const auth = data.auth ?? data
      const form = new FormData()
      form.append('file', file)
      form.append('fileName', file.name)
      form.append('publicKey', auth.publicKey)
      form.append('signature', auth.signature)
      form.append('expire', auth.expire)
      form.append('token', auth.token)

      const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: form,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Upload failed')
      onUploaded({ url: result.url, fileId: result.fileId })
    } catch (err) {
      setPreview('')
      setError(err.response ? getApiErrorMessage(err, 'Upload failed') : err.message || 'Upload failed')
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  const shown = preview || value
  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-4">
        {shown ? (
          <img src={shown} alt="Preview" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-brand-surface text-xs text-slate-400">
            No image
          </div>
        )}
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={uploading}
            className="text-sm"
          />
          {uploading && <p className="mt-1 text-xs font-semibold text-brand-primary">Uploading…</p>}
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default ImageUpload