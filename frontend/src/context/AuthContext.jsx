import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import api, {
  loginUser as loginRequest,
  registerUser as registerRequest,
  setUnauthorizedHandler,
} from '../api/axios.js'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const authVersion = useRef(0)

  useEffect(() => {
    let active = true
    const unregisterUnauthorizedHandler = setUnauthorizedHandler(() => {
      authVersion.current += 1
      if (active) setUser(null)
    })

    async function restoreSession() {
      const requestVersion = authVersion.current
      try {
        const { data } = await api.get('/api/auth/me')
        if (active && requestVersion === authVersion.current) {
          setUser(data.user)
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Unable to restore the user session:', error)
        }
        if (active && requestVersion === authVersion.current) {
          setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      active = false
      unregisterUnauthorizedHandler()
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await loginRequest(credentials)
    authVersion.current += 1
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (userDetails) => {
    const { data } = await registerRequest(userDetails)
    authVersion.current += 1
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    authVersion.current += 1
    try {
      await api.post('/api/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- Keep the auth hook beside its provider.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
