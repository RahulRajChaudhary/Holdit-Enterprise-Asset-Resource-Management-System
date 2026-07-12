import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Conflict-proof allocation',
    description:
      'Try to allocate an asset that’s already held and Holdit blocks it, shows who has it, and offers a transfer request instead of a dead end.',
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
      'Two people can never double-book the same room or vehicle — overlap validation runs inside a transaction, so it holds up under concurrent requests.',
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
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"
      />
    ),
  },
];

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@holdit.app' },
  { role: 'Asset Manager', email: 'manager@holdit.app' },
  { role: 'Department Head', email: 'head@holdit.app' },
  { role: 'Employee', email: 'employee@holdit.app' },
];

function Landing() {
  return (
    <div className="min-h-svh bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
              H
            </div>
            <span className="text-lg font-semibold text-gray-900">Holdit</span>
          </div>
          <Link
            to="/login"
            className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Know who holds what. <span className="text-accent-500">Always.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 sm:text-lg">
            Asset allocation, resource booking, and maintenance — with conflicts caught
            before they happen.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="w-full rounded-md bg-accent-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-600 sm:w-auto"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="w-full rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-accent-500 hover:text-accent-600 sm:w-auto"
            >
              Create account
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 p-6 text-left transition-shadow hover:shadow-sm"
              >
                <svg
                  className="h-8 w-8 text-accent-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  {feature.icon}
                </svg>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <p className="text-center text-sm font-medium text-gray-700">
              Jump straight in with a demo account — all use the password{' '}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">Demo@123</code>
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DEMO_ACCOUNTS.map((account) => (
                <Link
                  key={account.email}
                  to="/login"
                  state={{ prefillEmail: account.email }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center transition-colors hover:border-accent-500"
                >
                  <p className="text-xs font-medium text-gray-500">{account.role}</p>
                  <p className="mt-0.5 text-sm text-gray-900">{account.email}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 py-8 text-center text-xs text-gray-400">
        Built solo in 8 hours — Odoo Hackathon 2026
      </footer>
    </div>
  );
}

export default Landing;
