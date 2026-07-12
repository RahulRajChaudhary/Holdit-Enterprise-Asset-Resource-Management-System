import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Conflict-proof allocation',
    description:
      'Try to allocate an asset that’s already held and Holdit blocks it, shows who has it, and offers a transfer request instead of a dead end.',
    accent: 'from-accent-500/10 to-accent-500/0',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
      />
    ),
  },
  {
    title: 'Zero-overlap booking',
    description:
      'Two people can never double-book the same room or vehicle — overlap validation runs inside a transaction, so it holds under concurrent requests.',
    accent: 'from-accent-500/10 to-accent-500/0',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
      />
    ),
  },
  {
    title: 'Drag-and-drop maintenance',
    description:
      'Repairs move through Pending → Approved → Resolved on a kanban board — grab a card and the asset’s status flips live as it moves.',
    accent: 'from-accent-500/10 to-accent-500/0',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h4v12H4zM10 6h4v8h-4zM16 6h4v5h-4z"
      />
    ),
  },
];

const STATS = [
  { value: '0', label: 'Double-bookings possible' },
  { value: '4', label: 'Roles, one workflow' },
  { value: '3', label: 'Modules, one source of truth' },
  { value: '<1s', label: 'Conflict detection' },
];

const WORKFLOW = [
  { step: '01', title: 'Register', body: 'Add assets with serials, categories and custodians.' },
  { step: '02', title: 'Assign', body: 'Allocate or book — Holdit checks conflicts live.' },
  { step: '03', title: 'Track', body: 'Movements, repairs and returns land on one timeline.' },
];

function Landing() {
  return (
    <div className="min-h-svh bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-semibold text-white shadow-sm shadow-accent-500/30">
              H
            </div>
            <span className="text-lg font-semibold tracking-tight">Holdit</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#workflow" className="hover:text-gray-900">How it works</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Decorative background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(60rem 30rem at 20% -10%, rgba(15,110,86,0.10), transparent 60%), radial-gradient(40rem 20rem at 90% 10%, rgba(15,110,86,0.06), transparent 60%)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(17,24,39,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,24,39,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage:
                'radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)',
            }}
          />

          <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-12 lg:pb-28">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                Built for teams that share stuff
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Know who holds what.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-accent-600">Always.</span>
                  <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded bg-accent-500/15" />
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-gray-600 sm:text-lg">
                Asset allocation, resource booking and maintenance — with conflicts caught
                before they happen. One source of truth for every laptop, room and vehicle.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/signup"
                  data-testid="hero-signup-link"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-500 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent-500/30 transition-all hover:bg-accent-600 hover:shadow-md sm:w-auto"
                >
                  Create account
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  data-testid="hero-signin-link"
                  className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-accent-500 hover:text-accent-700 sm:w-auto"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 text-accent-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" />
                  </svg>
                  No credit card
                </span>
              </div>
            </div>

            {/* Product preview mock */}
            <div className="lg:col-span-6">
              <div className="relative">
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-accent-500/20 to-transparent blur-2xl" />
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-900/5">
                  {/* Fake window bar */}
                  <div className="flex items-center gap-1.5 px-1 pb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <span className="ml-3 text-xs text-gray-400">holdit.app / assets</span>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      <span>Asset</span>
                      <span>Held by</span>
                      <span>Status</span>
                    </div>
                    {[
                      { name: 'MacBook Pro 14"', tag: 'LT-0421', who: 'A. Kapoor', status: 'Allocated', dot: 'bg-blue-500' },
                      { name: 'Meeting Room · Aster', tag: 'RM-02', who: 'Design team · 3–4pm', status: 'Reserved', dot: 'bg-violet-500' },
                      { name: 'Toyota Innova', tag: 'VH-11', who: 'Ops · today', status: 'Reserved', dot: 'bg-violet-500' },
                      { name: 'iPad Air', tag: 'TB-08', who: '—', status: 'Available', dot: 'bg-emerald-500' },
                      { name: 'Projector Epson X', tag: 'PJ-03', who: 'Repair · IT desk', status: 'Maintenance', dot: 'bg-amber-500' },
                    ].map((row) => (
                      <div key={row.tag} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-400">{row.tag}</p>
                        </div>
                        <p className="hidden text-xs text-gray-600 sm:block">{row.who}</p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">
                          <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Conflict toast */}
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                    <p className="text-xs text-amber-800">
                      <span className="font-medium">Conflict blocked.</span> LT-0421 is currently held by A. Kapoor. Request a transfer instead?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-y border-gray-200 bg-gray-50">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center sm:text-left">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">Why Holdit</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Built to stop the messy bits.
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Three modules, one shared understanding of who has what — and when.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/5"
              >
                <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 ring-1 ring-inset ring-accent-500/20">
                  <svg className="h-5 w-5 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent-600 opacity-0 transition-opacity group-hover:opacity-100">
                  0{i + 1} · Core module
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">How it works</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                  From chaos to a clean ledger in three steps.
                </h2>
              </div>
              <Link to="/signup" data-testid="workflow-signup-link" className="text-sm font-medium text-accent-700 hover:text-accent-600">
                Start free →
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {WORKFLOW.map((w) => (
                <div key={w.step} className="relative rounded-2xl border border-gray-200 bg-white p-6">
                  <span className="text-xs font-mono font-medium text-accent-600">{w.step}</span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{w.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-accent-500 text-[10px] font-semibold text-white">H</div>
            <span>© {new Date().getFullYear()} Holdit. Know who holds what.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-gray-700">Features</a>
            <a href="#workflow" className="hover:text-gray-700">Workflow</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;