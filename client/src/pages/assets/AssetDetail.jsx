import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '../../components/AppShell';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getAsset, updateAsset } from '../../api/assets';
import { listCategories } from '../../api/categories';
import { listAllocationsForAsset } from '../../api/allocations';
import { listMaintenanceForAsset } from '../../api/maintenance';

function holderLabel(row) {
  return row.holder_type === 'EMPLOYEE' ? row.employee_name : `${row.department_name} (dept)`;
}

const MANUAL_TRANSITIONS = {
  AVAILABLE: ['RETIRED', 'LOST'],
  RETIRED: ['AVAILABLE', 'DISPOSED'],
  LOST: ['AVAILABLE'],
  DISPOSED: [],
  ALLOCATED: [],
  RESERVED: [],
  UNDER_MAINTENANCE: [],
};

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2.5 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function AssetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  async function refresh() {
    try {
      const data = await getAsset(id);
      setAsset(data);
      setLoadError('');
    } catch {
      setLoadError('Could not load this asset. It may not exist.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    listCategories()
      .then(setCategories)
      .catch(() => {});
    listAllocationsForAsset(id)
      .then(setAllocations)
      .catch(() => {});
    listMaintenanceForAsset(id)
      .then(setMaintenanceRequests)
      .catch(() => {});
  }, [id]);

  function startEditing() {
    setForm({
      name: asset.name,
      categoryId: asset.category_id || '',
      serialNumber: asset.serial_number || '',
      location: asset.location || '',
      condition: asset.condition,
      isBookable: asset.is_bookable,
    });
    setSaveError('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateAsset(id, {
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        serialNumber: form.serialNumber || null,
        location: form.location || null,
        condition: form.condition,
        isBookable: form.isBookable,
      });
      setAsset(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    setStatusError('');
    try {
      const updated = await updateAsset(id, { status: nextStatus });
      setAsset(updated);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Could not change the status.');
    }
  }

  if (loading) return <AppShell title="Asset"><p className="text-sm text-gray-500">Loading…</p></AppShell>;
  if (loadError) return <AppShell title="Asset"><p className="text-sm text-status-overdue">{loadError}</p></AppShell>;

  const canManage = user?.role === 'ASSET_MANAGER';
  const allowedTransitions = MANUAL_TRANSITIONS[asset.status] || [];

  return (
    <AppShell title={asset.asset_tag}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{asset.name}</h2>
                <p className="text-sm text-gray-500">{asset.category_name || 'Uncategorized'}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={asset.status} />
                {canManage && !editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-accent-500 hover:text-accent-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700">Category</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    >
                      <option value="">None</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Condition</label>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    >
                      {['NEW', 'GOOD', 'FAIR', 'DAMAGED'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700">Serial number</label>
                    <input
                      value={form.serialNumber}
                      onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Location</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isBookable}
                    onChange={(e) => setForm((f) => ({ ...f, isBookable: e.target.checked }))}
                    className="rounded border-gray-300 text-accent-500 focus:ring-accent-500/40"
                  />
                  Bookable as a shared resource
                </label>
                {saveError && <p className="text-xs text-status-overdue">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <DetailRow label="Serial number" value={asset.serial_number || '—'} />
                <DetailRow label="Location" value={asset.location || '—'} />
                <DetailRow label="Condition" value={asset.condition} />
                <DetailRow
                  label="Acquired"
                  value={asset.acquisition_date ? new Date(asset.acquisition_date).toLocaleDateString() : '—'}
                />
                <DetailRow
                  label="Acquisition cost"
                  value={asset.acquisition_cost ? `₹${Number(asset.acquisition_cost).toLocaleString()}` : '—'}
                />
                <DetailRow label="Bookable resource" value={asset.is_bookable ? 'Yes' : 'No'} />
              </div>
            )}

            {canManage && allowedTransitions.length > 0 && !editing && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500">Change status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allowedTransitions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-accent-500 hover:text-accent-700"
                    >
                      Mark {s.replace('_', ' ').toLowerCase()}
                    </button>
                  ))}
                </div>
                {statusError && <p className="mt-2 text-xs text-status-overdue">{statusError}</p>}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Allocation history</p>
              <Link to={`/allocations?assetId=${asset.id}`} className="text-xs font-medium text-accent-600 hover:text-accent-700">
                Manage allocation →
              </Link>
            </div>
            {allocations.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No allocations recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {allocations.map((a) => (
                  <li key={a.id} className="py-2.5 text-sm">
                    <p className="text-gray-900">
                      {holderLabel(a)} — {a.status === 'ACTIVE' ? 'currently holding' : 'returned'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Allocated {new Date(a.allocated_at).toLocaleDateString()}
                      {a.expected_return_date && ` · due ${new Date(a.expected_return_date).toLocaleDateString()}`}
                      {a.returned_at && ` · returned ${new Date(a.returned_at).toLocaleDateString()}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Maintenance history</p>
              <Link to="/maintenance" className="text-xs font-medium text-accent-600 hover:text-accent-700">
                Open maintenance board →
              </Link>
            </div>
            {maintenanceRequests.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No maintenance requests recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {maintenanceRequests.map((m) => (
                  <li key={m.id} className="py-2.5 text-sm">
                    <p className="text-gray-900">
                      {m.issue_description} — {m.status.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Raised {new Date(m.created_at).toLocaleDateString()} by {m.raised_by_name}
                      {m.technician_name && ` · technician ${m.technician_name}`}
                      {m.resolved_at && ` · resolved ${new Date(m.resolved_at).toLocaleDateString()}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm font-medium text-gray-900">QR tag</p>
          <div className="mt-4 flex justify-center">
            <QRCodeSVG value={asset.asset_tag} size={160} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Scan or search "{asset.asset_tag}" to find this asset.</p>
        </div>
      </div>
    </AppShell>
  );
}

export default AssetDetail;
