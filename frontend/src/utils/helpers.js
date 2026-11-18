// Finds the first array inside an API response (works for [..] and { products: [..] })
export function toList(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const found = Object.values(data).find(Array.isArray)
    if (found) return found
  }
  return []
}

export function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}