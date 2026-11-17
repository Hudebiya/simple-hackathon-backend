import { useState } from 'react'

function EyeIcon({ visible }) {
  return visible ? (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 12s3.1-6 8.5-6 8.5 6 8.5 6-3.1 6-8.5 6-8.5-6-8.5-6Z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c5.4 0 8.5 6 8.5 6a14 14 0 0 1-2.1 2.8M6.2 6.2C4.4 7.5 3.5 9 3.5 9S6.6 15 12 15c.6 0 1.2-.1 1.8-.2"
      />
    </svg>
  )
}

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && passwordVisible ? 'text' : type

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-brand-surface px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:ring-4 ${
            isPassword ? 'pr-12' : ''
          } ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-300 focus:border-brand-primary focus:ring-brand-primary/15'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <EyeIcon visible={passwordVisible} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default InputField
