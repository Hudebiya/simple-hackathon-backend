import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-brand-background px-5 text-brand-primary"
        role="status"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary/25 border-t-brand-primary"
          />
          <span className="text-sm font-semibold">Checking your session…</span>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
