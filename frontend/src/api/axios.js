import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || undefined,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let unauthorizedHandler

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = undefined
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthSubmission = /\/api\/auth\/(?:login|register)(?:[?#]|$)/.test(
      requestUrl,
    )

    if (error.response?.status === 401 && !isAuthSubmission) {
      unauthorizedHandler?.()
    }

    return Promise.reject(error)
  },
)

export function loginUser(credentials) {
  return api.post('/api/auth/login', credentials)
}

export function registerUser({ name, email, password }) {
  // The existing API names its required name field "username".
  return api.post('/api/auth/register', { username: name, email, password })
}

export function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export default api
