import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch (error) {
      console.error('Unable to complete server logout:', error)
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-brand-surface p-8 text-center shadow-[0_24px_70px_-30px_rgba(38,28,75,0.28)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Portal
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Welcome, {user.name}
        </h1>
        <div className="mt-6 space-y-3 rounded-xl bg-brand-background p-5 text-left text-sm">
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Email:</span>{' '}
            {user.email}
          </p>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-900">Role:</span>{' '}
            {user.role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-7 w-full rounded-xl bg-gradient-to-r from-brand-primary to-[#51427e] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-primary"
        >
          Log out
        </button>
        <p className="mt-5 text-xs text-slate-500">
          Your space, ready when you are.
        </p>
      </section>
    </main>
  )
}

export default Dashboard
