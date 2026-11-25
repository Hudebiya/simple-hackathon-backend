import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_CONFIG } from '../utils/roles.js'
import ThemeToggle from './ThemeToggle.jsx'

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const config = ROLE_CONFIG[user.role]
  const links = config.routes.filter((r) => r.nav)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // the session is cleared locally either way
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-background text-slate-900">
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 dark:bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-slate-200 bg-brand-surface p-4 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <p className="px-3 py-4 text-sm font-bold uppercase tracking-[0.18em] text-brand-primary">
          Inventory
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.path || 'index'}
              to={l.path ? `${config.base}/${l.path}` : config.base}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-brand-surface/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm lg:hidden"
          >
            ☰
          </button>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user.image && (
              <img src={user.image} alt="" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
            )}
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500">{config.label}</p>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout