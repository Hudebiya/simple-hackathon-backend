import { Link, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <main className="flex min-h-screen items-center justify-center bg-brand-background px-5">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-brand-surface p-8 text-center shadow-xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-primary">
                Portal
              </p>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                Page not found
              </h1>
              <p className="mt-2 text-slate-600">
                The page you’re looking for doesn’t exist.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                Back to Portal
              </Link>
            </section>
          </main>
        }
      />
    </Routes>
  )
}

export default App
