import { useCallback, useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/axios.js'

export default function useFetch(url, params) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [tick, setTick] = useState(0)
  const key = JSON.stringify(params || {})

  useEffect(() => {
    let active = true
    api
      .get(url, { params: JSON.parse(key) })
      .then((res) => {
        if (active) setState({ data: res.data, loading: false, error: '' })
      })
      .catch((err) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: getApiErrorMessage(err, 'Failed to load data'),
          })
        }
      })
    return () => {
      active = false
    }
  }, [url, key, tick])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    setTick((t) => t + 1)
  }, [])

  return { ...state, reload }
}