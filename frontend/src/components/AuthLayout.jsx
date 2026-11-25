const BRAND_NAME = "Portal"
const BRAND_TAGLINE = "A little more focus. A lot more room to grow."

function AuthLayout({ title, description, children, footer, notice }) {
  return (
    <main className="min-h-screen bg-brand-background font-sans text-slate-900 md:grid md:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#241d45] via-brand-primary to-[#564877] px-12 py-14 text-white md:flex md:flex-col md:justify-between lg:px-16 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-violet-300/10 blur-3xl"
        />

        <div className="relative">
          <p className="text-xl font-extrabold tracking-tight">{BRAND_NAME}</p>
        </div>

        <div className="relative max-w-xl pb-8">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            A space of your own
          </span>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Make your next move feel effortless.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-violet-100/80">
            {BRAND_TAGLINE}
          </p>
          <div
            aria-hidden="true"
            className="mt-12 flex items-center gap-3"
          >
            <span className="h-1 w-12 rounded-full bg-brand-accent" />
            <span className="h-1 w-5 rounded-full bg-white/35" />
            <span className="h-1 w-3 rounded-full bg-white/20" />
          </div>
        </div>

        <p className="relative text-xs text-violet-100/60">
          Thoughtfully made for wherever you’re headed.
        </p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 md:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <p className="mb-7 text-center text-lg font-extrabold tracking-tight text-brand-primary md:hidden">
            {BRAND_NAME}
          </p>

          <div className="auth-card-enter rounded-2xl border border-slate-200/80 bg-brand-surface p-6 shadow-[0_24px_70px_-30px_rgba(38,28,75,0.28)] sm:p-9 lg:p-10">
            <header className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
                {BRAND_NAME}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </header>

            {notice && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-5 ${
                  notice.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
                role={notice.type === 'error' ? 'alert' : 'status'}
              >
                {notice.message}
              </div>
            )}

            {children}

            <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
