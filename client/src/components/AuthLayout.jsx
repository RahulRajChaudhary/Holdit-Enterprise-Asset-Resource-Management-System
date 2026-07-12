function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-svh flex flex-col md:flex-row">
      <section className="hidden md:flex md:w-5/12 lg:w-1/2 flex-col justify-between bg-accent-700 p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            H
          </div>
          <span className="text-lg font-semibold">Holdit</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Know who holds what.<br />Always.</h2>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            Asset allocation, resource booking, and maintenance — with conflicts caught
            before they happen.
          </p>
        </div>
        <p className="text-xs text-white/50">Built for the Odoo Hackathon</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
              H
            </div>
            <span className="text-lg font-semibold text-gray-900">Holdit</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
