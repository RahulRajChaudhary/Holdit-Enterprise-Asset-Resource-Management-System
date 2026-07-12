import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppShell from '../components/AppShell';
import { listAssets } from '../api/assets';
import { listDepartments } from '../api/departments';
import { listEmployees } from '../api/employees';
import {
  listOverdueAllocations,
  listUpcomingReturns,
  listTransferRequests,
  listMyAllocations,
  listDepartmentAllocations,
  requestReturn,
} from '../api/allocations';
import { listActiveBookings, listMyBookings, cancelBooking } from '../api/bookings';
import StatusBadge from '../components/StatusBadge';
import { countActiveMaintenance } from '../api/maintenance';

function KpiTile({ label, value, soon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {soon ? (
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-gray-300">—</p>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Soon</span>
        </div>
      ) : (
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      )}
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function QuickAction({ label, to, enabled }) {
  if (enabled) {
    return (
      <Link
        to={to}
        className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
      >
        {label}
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400">
      {label}
      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Soon</span>
    </span>
  );
}

function OverdueReturnsBanner() {
  const [overdue, setOverdue] = useState(null);

  useEffect(() => {
    listOverdueAllocations()
      .then(setOverdue)
      .catch(() => setOverdue([]));
  }, []);

  if (!overdue || overdue.length === 0) return null;

  return (
    <div className="rounded-lg border border-status-overdue/30 bg-status-overdue/5 px-4 py-3">
      <p className="text-sm font-medium text-status-overdue">
        {overdue.length} asset{overdue.length === 1 ? '' : 's'} overdue for return — flagged for follow-up
      </p>
    </div>
  );
}

function DashboardKpis() {
  const [assets, setAssets] = useState(null);
  const [pendingTransfers, setPendingTransfers] = useState(null);
  const [upcomingReturns, setUpcomingReturns] = useState(null);
  const [activeBookings, setActiveBookings] = useState(null);
  const [activeMaintenance, setActiveMaintenance] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      listAssets(),
      listTransferRequests({ status: 'PENDING' }),
      listUpcomingReturns(),
      listActiveBookings(),
      countActiveMaintenance(),
    ])
      .then(([assetRows, transferRows, returnRows, bookingRows, maintenanceCount]) => {
        setAssets(assetRows);
        setPendingTransfers(transferRows.length);
        setUpcomingReturns(returnRows.length);
        setActiveBookings(bookingRows.length);
        setActiveMaintenance(maintenanceCount);
      })
      .catch(() => setLoadError('Could not load dashboard counts. Check your connection and try again.'));
  }, []);

  if (loadError) return <p className="text-sm text-status-overdue">{loadError}</p>;
  if (!assets) return <p className="text-sm text-gray-500">Loading…</p>;

  const countOf = (status) => assets.filter((a) => a.status === status).length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <KpiTile label="Assets Available" value={countOf('AVAILABLE')} />
      <KpiTile label="Assets Allocated" value={countOf('ALLOCATED')} />
      <KpiTile label="Maintenance Today" value={activeMaintenance} />
      <KpiTile label="Active Bookings" value={activeBookings} />
      <KpiTile label="Pending Transfers" value={pendingTransfers} />
      <KpiTile label="Upcoming Returns" value={upcomingReturns} />
    </div>
  );
}

function AdminOrgSetup() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([listDepartments(), listEmployees()])
      .then(([depts, emps]) => {
        setDepartments(depts);
        setEmployees(emps);
      })
      .catch(() => setLoadError('Could not load organization data. Check your connection and try again.'));
  }, []);

  if (loadError) return <p className="text-sm text-status-overdue">{loadError}</p>;

  const activeDepartments = departments.filter((d) => d.status === 'ACTIVE').length;
  const awaitingPromotion = employees.filter((e) => e.role === 'EMPLOYEE').length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">Organization setup</p>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiTile label="Active departments" value={`${activeDepartments} / ${departments.length}`} />
        <KpiTile label="Employees" value={employees.length} />
        <KpiTile label="Awaiting role assignment" value={awaitingPromotion} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link to="/admin/departments" className="text-accent-600 hover:text-accent-700">
          Manage departments
        </Link>
        <Link to="/admin/categories" className="text-accent-600 hover:text-accent-700">
          Manage categories
        </Link>
        <Link to="/admin/employees" className="text-accent-600 hover:text-accent-700">
          Employee directory
        </Link>
      </div>
    </div>
  );
}

function MyAssetsCard() {
  const [allocations, setAllocations] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [requestingId, setRequestingId] = useState(null);

  function refresh() {
    listMyAllocations()
      .then(setAllocations)
      .catch(() => setLoadError('Could not load your allocated assets.'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRequestReturn(assetId) {
    setRequestingId(assetId);
    try {
      await requestReturn(assetId);
      refresh();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not request a return for this asset.');
    } finally {
      setRequestingId(null);
    }
  }

  if (loadError) return <p className="text-sm text-status-overdue">{loadError}</p>;
  if (!allocations || allocations.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">Assets allocated to me</p>
      <ul className="mt-3 divide-y divide-gray-100">
        {allocations.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <Link to={`/assets/${a.asset_id}`} className="text-gray-900 hover:text-accent-700">
                {a.asset_tag} — {a.asset_name}
              </Link>
              {a.expected_return_date && (
                <p className="text-xs text-gray-500">Due {new Date(a.expected_return_date).toLocaleDateString()}</p>
              )}
            </div>
            {a.return_requested_at ? (
              <span className="text-xs font-medium text-status-reserved">Return requested</span>
            ) : (
              <button
                type="button"
                disabled={requestingId === a.asset_id}
                onClick={() => handleRequestReturn(a.asset_id)}
                className="text-xs font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50"
              >
                Request return
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MyBookingsCard() {
  const [bookings, setBookings] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  function refresh() {
    listMyBookings()
      .then(setBookings)
      .catch(() => setLoadError('Could not load your bookings.'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      refresh();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loadError) return <p className="text-sm text-status-overdue">{loadError}</p>;
  if (!bookings) return null;

  const upcoming = bookings.filter((b) => ['UPCOMING', 'ONGOING'].includes(b.display_status));
  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">My bookings</p>
      <ul className="mt-3 divide-y divide-gray-100">
        {upcoming.map((b) => (
          <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <Link to={`/assets/${b.asset_id}`} className="text-gray-900 hover:text-accent-700">
                {b.asset_tag} — {b.asset_name}
              </Link>
              <p className="text-xs text-gray-500">
                {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={b.display_status} />
              <button
                type="button"
                disabled={cancellingId === b.id}
                onClick={() => handleCancel(b.id)}
                className="text-xs font-medium text-gray-400 hover:text-status-overdue disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DepartmentAssetsCard() {
  const [allocations, setAllocations] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listDepartmentAllocations()
      .then(setAllocations)
      .catch(() => setLoadError('Could not load department assets.'));
  }, []);

  if (loadError) return <p className="text-sm text-status-overdue">{loadError}</p>;
  if (!allocations) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">Assets allocated within my department</p>
      {allocations.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No assets currently allocated in your department.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {allocations.map((a) => (
            <li key={a.id} className="py-2.5 text-sm">
              <Link to={`/assets/${a.asset_id}`} className="text-gray-900 hover:text-accent-700">
                {a.asset_tag} — {a.asset_name}
              </Link>
              <p className="text-xs text-gray-500">
                Held by {a.holder_type === 'EMPLOYEE' ? a.employee_name : `${a.department_name} (dept)`}
                {a.expected_return_date && ` · due ${new Date(a.expected_return_date).toLocaleDateString()}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <DashboardKpis />
        <OverdueReturnsBanner />

        <div className="flex flex-wrap gap-3">
          <QuickAction label="Register Asset" to="/assets/new" enabled={user.role === 'ASSET_MANAGER'} />
          <QuickAction label="Book Resource" to="/bookings" enabled />
          <QuickAction label="Raise Maintenance Request" to="/maintenance" enabled />
        </div>

        {user.role === 'ADMIN' && <AdminOrgSetup />}
        <MyAssetsCard />
        <MyBookingsCard />
        {user.role === 'DEPARTMENT_HEAD' && <DepartmentAssetsCard />}
      </div>
    </AppShell>
  );
}

export default Dashboard;
