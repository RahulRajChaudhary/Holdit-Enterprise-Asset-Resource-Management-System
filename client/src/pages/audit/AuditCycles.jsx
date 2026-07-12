import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { listEmployees } from '../../api/employees';
import { listAuditCycles, getAuditCycle, createAuditCycle, markAuditItem, closeAuditCycle } from '../../api/audits';

const VERIFICATIONS = ['VERIFIED', 'MISSING', 'DAMAGED'];

const VERIFICATION_STYLE = {
  VERIFIED: 'bg-status-available/10 text-status-available',
  MISSING: 'bg-status-overdue/10 text-status-overdue',
  DAMAGED: 'bg-status-maintenance/10 text-status-maintenance',
};

const EMPTY_FORM = { name: '', location: '', startDate: '', endDate: '', auditorIds: [] };

function AuditCycles() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const [markingId, setMarkingId] = useState(null);
  const [closing, setClosing] = useState(false);

  function refreshCycles() {
    listAuditCycles()
      .then(setCycles)
      .catch(() => setLoadError('Could not load audit cycles. Check your connection and try again.'));
  }

  useEffect(() => {
    refreshCycles();
    listEmployees().then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    getAuditCycle(selectedId).then(setDetail).catch(() => setLoadError('Could not load this audit cycle.'));
  }, [selectedId]);

  function toggleAuditor(id) {
    setForm((f) => ({
      ...f,
      auditorIds: f.auditorIds.includes(id) ? f.auditorIds.filter((a) => a !== id) : [...f.auditorIds, id],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Give this audit cycle a name.');
    if (!form.startDate || !form.endDate) return setFormError('Pick a start and end date.');
    if (form.auditorIds.length === 0) return setFormError('Assign at least one auditor.');

    setCreating(true);
    try {
      const cycle = await createAuditCycle({
        name: form.name.trim(),
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        auditorIds: form.auditorIds,
      });
      setForm(EMPTY_FORM);
      refreshCycles();
      setSelectedId(cycle.id);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create this audit cycle.');
    } finally {
      setCreating(false);
    }
  }

  async function handleMark(assetId, verification) {
    setMarkingId(assetId);
    try {
      const updated = await markAuditItem(selectedId, assetId, verification);
      setDetail(updated);
      refreshCycles();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not record this verification.');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      const updated = await closeAuditCycle(selectedId);
      setDetail(updated);
      refreshCycles();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not close this audit cycle.');
    } finally {
      setClosing(false);
    }
  }

  const discrepancyCount = detail ? detail.items.filter((i) => ['MISSING', 'DAMAGED'].includes(i.verification)).length : 0;
  const isAuditor = detail ? detail.auditors.some((a) => a.id === user?.id) : false;
  const canVerify = detail && detail.status === 'OPEN' && (canManage || isAuditor);

  return (
    <AppShell title="Asset Audit">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {canManage && (
            <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">New audit cycle</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Q3 audit: Engineering dept"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Location scope (optional)</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Leave blank to audit every asset"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Start date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">End date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Auditors</label>
                  <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.auditorIds.includes(emp.id)}
                          onChange={() => toggleAuditor(emp.id)}
                          className="rounded border-gray-300 text-accent-500 focus:ring-accent-500/40"
                        />
                        {emp.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {formError && <p className="mt-2 text-xs text-status-overdue">{formError}</p>}
              <button
                type="submit"
                disabled={creating}
                className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create audit cycle'}
              </button>
            </form>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">Audit cycles</p>
            {loadError && <p className="mt-2 text-xs text-status-overdue">{loadError}</p>}
            {cycles.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No audit cycles yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {cycles.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                        selectedId === c.id ? 'border-accent-500 bg-accent-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()} ·{' '}
                        {c.status === 'OPEN' ? 'Open' : 'Closed'} · {c.verified_count}/{c.item_count} verified
                        {c.discrepancy_count > 0 && ` · ${c.discrepancy_count} flagged`}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!detail ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Select an audit cycle to view its checklist.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{detail.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(detail.start_date).toLocaleDateString()} – {new Date(detail.end_date).toLocaleDateString()}
                    {detail.location && ` · ${detail.location}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Auditors: {detail.auditors.map((a) => a.name).join(', ') || 'None'}
                  </p>
                </div>
                {canManage && detail.status === 'OPEN' && (
                  <button
                    type="button"
                    disabled={closing}
                    onClick={handleClose}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-accent-500 hover:text-accent-700 disabled:opacity-50"
                  >
                    {closing ? 'Closing…' : 'Close audit cycle'}
                  </button>
                )}
                {detail.status === 'CLOSED' && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">Closed</span>
                )}
              </div>

              {discrepancyCount > 0 && (
                <div className="mt-3 rounded-md bg-status-overdue/5 px-3 py-2 text-xs font-medium text-status-overdue">
                  {discrepancyCount} asset{discrepancyCount === 1 ? '' : 's'} flagged — discrepancy report generated
                  automatically
                </div>
              )}

              <table className="mt-4 w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="py-2">Asset</th>
                    <th className="py-2">Expected location</th>
                    <th className="py-2">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-2.5 text-gray-900">
                        {item.asset_tag} — {item.asset_name}
                      </td>
                      <td className="py-2.5 text-gray-600">{item.asset_location || '—'}</td>
                      <td className="py-2.5">
                        {canVerify ? (
                          <div className="flex gap-1.5">
                            {VERIFICATIONS.map((v) => (
                              <button
                                key={v}
                                type="button"
                                disabled={markingId === item.asset_id}
                                onClick={() => handleMark(item.asset_id, v)}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                                  item.verification === v
                                    ? VERIFICATION_STYLE[v]
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ) : item.verification ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${VERIFICATION_STYLE[item.verification]}`}>
                            {item.verification}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default AuditCycles;
