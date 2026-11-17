import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import InputField from '../components/InputField.jsx'
import { getApiErrorMessage } from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  function validate() {
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await login({ email: form.email.trim(), password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to sign in. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const successMessage = location.state?.successMessage

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to your account."
      notice={
        serverError
          ? { type: 'error', message: serverError }
          : successMessage
            ? { type: 'success', message: successMessage }
            : null
      }
      footer={
        <>
          Don’t have an account?{' '}
          <Link
            to="/signup"
            className="rounded-sm font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 transition hover:text-[#5a4a83] hover:decoration-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
          >
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <InputField
          id="email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={updateField}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={updateField}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-[#51427e] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:brightness-100"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
