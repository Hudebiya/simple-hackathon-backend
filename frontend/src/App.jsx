import { createElement } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import { ROLE_CONFIG } from './utils/roles.js'

// Picks up pages/<role-folder>/<File>.jsx automatically; shows a placeholder until the file exists
const modules = import.meta.glob('./pages/*/*.jsx', { eager: true })

function Placeholder({ title }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-brand-surface p-10 text-center">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">This page is coming soon.</p>
    </div>
  )
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={ROLE_CONFIG[user.role]?.base ?? '/unauthorized'} replace />
}

function MessagePage({ title, text }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-5">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-brand-surface p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{text}</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Back to home
        </Link>
      </section>
    </main>
  )
}

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
            <RoleHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/unauthorized"
        element={<MessagePage title="Access Denied" text="You do not have permission to view this page." />}
      />

      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
        const folder = cfg.base.slice(1)
        return (
          <Route
            key={role}
            path={cfg.base}
            element={
              <ProtectedRoute allowedRoles={[role]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {cfg.routes.map((r) => {
              const page = modules[`./pages/${folder}/${r.file}.jsx`]?.default
              const element = createElement(page ?? Placeholder, { title: r.label })
              return r.path === '' ? (
                <Route key="index" index element={element} />
              ) : (
                <Route key={r.path} path={r.path} element={element} />
              )
            })}
          </Route>
        )
      })}

      <Route path="*" element={<MessagePage title="Page not found" text="The page you’re looking for doesn’t exist." />} />
    </Routes>
  )
}

export default App