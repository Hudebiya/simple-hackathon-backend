// Finds the first array inside an API response (works for [..] and { products: [..] })
export function toList(data) {
  let list = []
  if (Array.isArray(data)) list = data
  else if (data && typeof data === 'object') {
    list = Object.values(data).find(Array.isArray) ?? []
  }
  // some API responses use `id` instead of `_id`; make both available
  return list.map((item) =>
    item && typeof item === 'object' && item._id == null && item.id != null
      ? { ...item, _id: item.id }
      : item,
  )
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