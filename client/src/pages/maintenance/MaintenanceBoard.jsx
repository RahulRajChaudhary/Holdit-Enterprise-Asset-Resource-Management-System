import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import AssetPicker from '../../components/AssetPicker';
import { useAuth } from '../../hooks/useAuth';
import {
  listMaintenanceRequests,
  raiseMaintenanceRequest,
  decideMaintenanceRequest,
  assignTechnician,
  startMaintenanceProgress,
  resolveMaintenanceRequest,
} from '../../api/maintenance';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const COLUMNS = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'TECHNICIAN_ASSIGNED', label: 'Technician Assigned' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'REJECTED', label: 'Rejected' },
];

const PRIORITY_STYLE = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-status-reserved/10 text-status-reserved',
  HIGH: 'bg-status-maintenance/10 text-status-maintenance',
  URGENT: 'bg-status-overdue/10 text-status-overdue',
};

function RequestCard({ request, canManage, onAction, busy }) {
  const [technicianName, setTechnicianName] = useState('');

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">
          {request.asset_tag} — {request.asset_name}
        </p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLE[request.priority]}`}>
          {request.priority}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-600">{request.issue_description}</p>
      <p className="mt-1 text-[11px] text-gray-400">Raised by {request.raised_by_name}</p>
      {request.technician_name && (
        <p className="mt-1 text-[11px] text-gray-500">Technician: {request.technician_name}</p>
      )}

      {canManage && (
        <div className="mt-2 space-y-2">
          {request.status === 'PENDING' && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('decide', request.id, 'APPROVED')}
                className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('decide', request.id, 'REJECTED')}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-status-overdue hover:text-status-overdue disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
          {request.status === 'APPROVED' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (technicianName.trim()) onAction('assign', request.id, technicianName.trim());
              }}
              className="flex gap-1.5"
            >
              <input
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Technician name"
                className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-accent-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                Assign
              </button>
            </form>
          )}
          {request.status === 'TECHNICIAN_ASSIGNED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction('start', request.id)}
              className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
            >
              Start progress
            </button>
          )}
          {request.status === 'IN_PROGRESS' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction('resolve', request.id)}
              className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
            >
              Mark resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MaintenanceBoard() {
  const { user } = useAuth();
  const canManage = user?.role === 'ASSET_MANAGER' || user?.role === 'ADMIN';

  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [asset, setAsset] = useState(null);
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    listMaintenanceRequests()
      .then(setRequests)
      .catch(() => setLoadError('Could not load maintenance requests. Check your connection and try again.'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRaise(e) {
    e.preventDefault();
    setFormError('');
    if (!asset) return setFormError('Select an asset first.');
    if (!issue.trim()) return setFormError('Describe the issue.');

    setSubmitting(true);
    try {
      await raiseMaintenanceRequest({ assetId: asset.id, issueDescription: issue.trim(), priority });
      setAsset(null);
      setIssue('');
      setPriority('MEDIUM');
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not submit the request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(action, id, extra) {
    setBusyId(id);
    try {
      if (action === 'decide') await decideMaintenanceRequest(id, extra);
      if (action === 'assign') await assignTechnician(id, extra);
      if (action === 'start') await startMaintenanceProgress(id);
      if (action === 'resolve') await resolveMaintenanceRequest(id);
      refresh();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Maintenance Management">
      <form onSubmit={handleRaise} className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-900">Raise a maintenance request</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-500">Asset</label>
            <div className="mt-1">
              <AssetPicker onSelect={setAsset} placeholder="Search asset…" />
            </div>
            {asset && (
              <p className="mt-1 text-xs text-gray-600">
                {asset.asset_tag} — {asset.name}
              </p>
            )}
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-500">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-500">Issue</label>
            <input
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            />
          </div>
        </div>
        {formError && <p className="mt-2 text-xs text-status-overdue">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Raise request'}
        </button>
      </form>

      {loadError && <p className="mt-4 text-sm text-status-overdue">{loadError}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{col.label}</p>
            <div className="mt-3 space-y-3">
              {requests
                .filter((r) => r.status === col.status)
                .map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    canManage={canManage}
                    onAction={handleAction}
                    busy={busyId === r.id}
                  />
                ))}
              {requests.filter((r) => r.status === col.status).length === 0 && (
                <p className="text-xs text-gray-400">Nothing here.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default MaintenanceBoard;
