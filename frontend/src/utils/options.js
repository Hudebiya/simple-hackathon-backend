import api from '../api/axios.js'
import { toList } from './helpers.js'

export function optionsFrom(url, params, label = (item) => item.name) {
  return async () => {
    const { data } = await api.get(url, { params })
    return toList(data).map((item) => ({ value: item._id, label: label(item) }))
  }
}