import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', built: true },
  { to: '/admin/departments', label: 'Organization setup', built: true, roles: ['ADMIN'], matchPrefix: '/admin' },
  { to: '/assets', label: 'Assets', built: true, matchPrefix: '/assets' },
  { to: '/allocations', label: 'Allocation & Transfer', built: true, matchPrefix: '/allocations' },
  { to: '/bookings', label: 'Resource Booking', built: true, matchPrefix: '/bookings' },
  { to: '/maintenance', label: 'Maintenance', built: true, matchPrefix: '/maintenance' },
  { to: '/audits', label: 'Audit', built: true, matchPrefix: '/audits' },
  { to: '/reports', label: 'Reports', built: true, matchPrefix: '/reports' },
  { to: '/notifications', label: 'Notifications', built: true, matchPrefix: '/notifications' },
];

function AppShell({ title, children }) {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleSignOut() {
    clearSession();
    navigate('/login');
  }

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <div className="flex min-h-svh bg-gray-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-semibold text-white">
            H
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">Holdit</span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((item) =>
            item.built ? (
              <NavLink
                key={item.label}
                to={item.to}
                className={
                  (item.matchPrefix ? location.pathname.startsWith(item.matchPrefix) : location.pathname === item.to)
                    ? 'block rounded-md bg-accent-50 px-3 py-2 text-sm font-medium text-accent-700'
                    : 'block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-400"
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  Soon
                </span>
              </div>
            )
          )}
        </nav>

        <div className="border-t border-gray-100 px-5 py-4">
          <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role] || user?.role}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 text-xs font-medium text-gray-500 hover:text-accent-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <span className="text-lg font-semibold text-gray-900">Holdit</span>
          <button type="button" onClick={handleSignOut} className="text-sm text-gray-600">
            Sign out
          </button>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
