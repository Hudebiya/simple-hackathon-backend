// Finds the first array inside an API response (works for [..] and { products: [..] })
export function toList(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const found = Object.values(data).find(Array.isArray)
    if (found) return found
  }
  return []
}

export function idOf(value) {
  if (value && typeof value === 'object') return value._id ?? value.id ?? ''
  return value ?? ''
}

export function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

export function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}