import { useTheme } from '../context/ThemeContext.jsx'

function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const switchesTo = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      aria-label={`Switch to ${switchesTo} mode`}
      title={`Switch to ${switchesTo} mode`}
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${className}`}
    >
      {theme === 'dark' ? (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
          />
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
            d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"
          />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
