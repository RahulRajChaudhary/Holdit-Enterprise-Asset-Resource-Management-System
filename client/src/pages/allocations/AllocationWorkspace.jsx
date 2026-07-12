import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import StatusBadge from '../../components/StatusBadge';
import AssetPicker from '../../components/AssetPicker';
import { useAuth } from '../../hooks/useAuth';
import { getAsset } from '../../api/assets';
import { listEmployees } from '../../api/employees';
import { listDepartments } from '../../api/departments';
import {
  listAllocationsForAsset,
  allocateAsset,
  returnAsset,
  requestTransfer,
  listTransferRequests,
  decideTransfer,
} from '../../api/allocations';

const RETURN_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED'];

function holderLabel(row) {
  return row.holder_type === 'EMPLOYEE' ? row.employee_name : `${row.department_name} (dept)`;
}

function isOverdue(row) {
  return row.status === 'ACTIVE' && row.expected_return_date && new Date(row.expected_return_date) < new Date();
}

function AllocationWorkspace() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const canManage = user?.role === 'ASSET_MANAGER' || user?.role === 'ADMIN';

  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [allocateForm, setAllocateForm] = useState({ holderType: 'EMPLOYEE', targetId: '', expectedReturnDate: '' });
  const [allocateError, setAllocateError] = useState('');
  const [allocating, setAllocating] = useState(false);

  const [transferForm, setTransferForm] = useState({ toType: 'EMPLOYEE', targetId: '', reason: '' });
  const [transferError, setTransferError] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const [returnForm, setReturnForm] = useState({ condition: 'GOOD', notes: '' });
  const [returnError, setReturnError] = useState('');
  const [returning, setReturning] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingError, setPendingError] = useState('');
  const [decidingId, setDecidingId] = useState(null);

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => {});
    listDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (canManage) {
      refreshPending();
    }
  }, [canManage]);

  useEffect(() => {
    const preselectId = searchParams.get('assetId');
    if (preselectId) {
      getAsset(preselectId).then(selectAsset).catch(() => {});
    }
  }, []);

  function refreshPending() {
    listTransferRequests({ status: 'PENDING' })
      .then(setPendingRequests)
      .catch(() => setPendingError('Could not load pending transfer requests.'));
  }

  async function selectAsset(nextAsset) {
    setAsset(nextAsset);
    setAllocateError('');
    setTransferError('');
    setReturnError('');
    setAllocateForm({ holderType: 'EMPLOYEE', targetId: '', expectedReturnDate: '' });
    setTransferForm({ toType: 'EMPLOYEE', targetId: '', reason: '' });
    setReturnForm({ condition: nextAsset.condition || 'GOOD', notes: '' });
    const rows = await listAllocationsForAsset(nextAsset.id).catch(() => []);
    setHistory(rows);
  }

  async function refreshAsset() {
    const updated = await getAsset(asset.id);
    setAsset(updated);
    const rows = await listAllocationsForAsset(asset.id).catch(() => []);
    setHistory(rows);
  }

  const activeAllocation = history.find((h) => h.status === 'ACTIVE') || null;

  async function handleAllocate(e) {
    e.preventDefault();
    setAllocateError('');
    if (!allocateForm.targetId) {
      return setAllocateError(`Select ${allocateForm.holderType === 'EMPLOYEE' ? 'an employee' : 'a department'}.`);
    }
    setAllocating(true);
    try {
      await allocateAsset({
        assetId: asset.id,
        holderType: allocateForm.holderType,
        employeeId: allocateForm.holderType === 'EMPLOYEE' ? allocateForm.targetId : undefined,
        departmentId: allocateForm.holderType === 'DEPARTMENT' ? allocateForm.targetId : undefined,
        expectedReturnDate: allocateForm.expectedReturnDate || undefined,
      });
      await refreshAsset();
    } catch (err) {
      setAllocateError(err.response?.data?.message || 'Could not allocate this asset.');
    } finally {
      setAllocating(false);
    }
  }

  async function handleRequestTransfer(e) {
    e.preventDefault();
    setTransferError('');
    if (!transferForm.targetId) {
      return setTransferError(`Select ${transferForm.toType === 'EMPLOYEE' ? 'an employee' : 'a department'}.`);
    }
    setSubmittingTransfer(true);
    try {
      await requestTransfer({
        assetId: asset.id,
        toEmployeeId: transferForm.toType === 'EMPLOYEE' ? transferForm.targetId : undefined,
        toDepartmentId: transferForm.toType === 'DEPARTMENT' ? transferForm.targetId : undefined,
        reason: transferForm.reason || undefined,
      });
      setTransferForm({ toType: 'EMPLOYEE', targetId: '', reason: '' });
      if (canManage) refreshPending();
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Could not submit the transfer request.');
    } finally {
      setSubmittingTransfer(false);
    }
  }

  async function handleReturn(e) {
    e.preventDefault();
    setReturnError('');
    setReturning(true);
    try {
      await returnAsset({ assetId: asset.id, condition: returnForm.condition, notes: returnForm.notes || undefined });
      await refreshAsset();
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Could not mark this asset returned.');
    } finally {
      setReturning(false);
    }
  }

  async function handleDecide(requestId, decision) {
    setDecidingId(requestId);
    setPendingError('');
    try {
      await decideTransfer(requestId, decision);
      refreshPending();
      if (asset) refreshAsset();
    } catch (err) {
      setPendingError(err.response?.data?.message || 'Could not update this transfer request.');
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <AppShell title="Allocation & Transfer">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700">Asset</label>
            <div className="mt-2">
              <AssetPicker onSelect={selectAsset} />
            </div>

            {asset && (
              <div className="mt-4 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {asset.asset_tag} — {asset.name}
                  </p>
                  <p className="text-xs text-gray-500">{asset.category_name || 'Uncategorized'}</p>
                </div>
                <StatusBadge status={asset.status} />
              </div>
            )}
          </div>

          {asset && asset.status === 'AVAILABLE' && (
            <form onSubmit={handleAllocate} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">Allocate this asset</p>
              <div className="mt-3 flex gap-4 text-sm text-gray-700">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={allocateForm.holderType === 'EMPLOYEE'}
                    onChange={() => setAllocateForm((f) => ({ ...f, holderType: 'EMPLOYEE', targetId: '' }))}
                  />
                  Employee
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={allocateForm.holderType === 'DEPARTMENT'}
                    onChange={() => setAllocateForm((f) => ({ ...f, holderType: 'DEPARTMENT', targetId: '' }))}
                  />
                  Department
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500">
                    {allocateForm.holderType === 'EMPLOYEE' ? 'Employee' : 'Department'}
                  </label>
                  <select
                    value={allocateForm.targetId}
                    onChange={(e) => setAllocateForm((f) => ({ ...f, targetId: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  >
                    <option value="">Select…</option>
                    {(allocateForm.holderType === 'EMPLOYEE' ? employees : departments).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Expected return date (optional)</label>
                  <input
                    type="date"
                    value={allocateForm.expectedReturnDate}
                    onChange={(e) => setAllocateForm((f) => ({ ...f, expectedReturnDate: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
              </div>
              {allocateError && <p className="mt-2 text-xs text-status-overdue">{allocateError}</p>}
              <button
                type="submit"
                disabled={allocating}
                className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {allocating ? 'Allocating…' : 'Allocate asset'}
              </button>
            </form>
          )}

          {asset && asset.status === 'ALLOCATED' && (
            <div className="rounded-xl border border-status-overdue/30 bg-status-overdue/5 p-4">
              <p className="text-sm font-medium text-status-overdue">
                Already allocated to {activeAllocation ? holderLabel(activeAllocation) : 'someone else'}
                {activeAllocation?.expected_return_date &&
                  ` — expected back ${new Date(activeAllocation.expected_return_date).toLocaleDateString()}`}
                {activeAllocation && isOverdue(activeAllocation) && ' (overdue)'}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Direct re-allocation is blocked. Submit a transfer request below instead.
              </p>
            </div>
          )}

          {asset && asset.status === 'ALLOCATED' && (
            <form onSubmit={handleRequestTransfer} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">Transfer request</p>
              <div className="mt-3 flex gap-4 text-sm text-gray-700">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={transferForm.toType === 'EMPLOYEE'}
                    onChange={() => setTransferForm((f) => ({ ...f, toType: 'EMPLOYEE', targetId: '' }))}
                  />
                  To employee
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={transferForm.toType === 'DEPARTMENT'}
                    onChange={() => setTransferForm((f) => ({ ...f, toType: 'DEPARTMENT', targetId: '' }))}
                  />
                  To department
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500">
                    {transferForm.toType === 'EMPLOYEE' ? 'Employee' : 'Department'}
                  </label>
                  <select
                    value={transferForm.targetId}
                    onChange={(e) => setTransferForm((f) => ({ ...f, targetId: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  >
                    <option value="">Select…</option>
                    {(transferForm.toType === 'EMPLOYEE' ? employees : departments).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Reason (optional)</label>
                  <input
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm((f) => ({ ...f, reason: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
              </div>
              {transferError && <p className="mt-2 text-xs text-status-overdue">{transferError}</p>}
              <button
                type="submit"
                disabled={submittingTransfer}
                className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {submittingTransfer ? 'Submitting…' : 'Submit request'}
              </button>
            </form>
          )}

          {asset && asset.status === 'ALLOCATED' && canManage && (
            <form onSubmit={handleReturn} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">Mark returned</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500">Condition check-in</label>
                  <select
                    value={returnForm.condition}
                    onChange={(e) => setReturnForm((f) => ({ ...f, condition: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  >
                    {RETURN_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Notes (optional)</label>
                  <input
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm((f) => ({ ...f, notes: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                  />
                </div>
              </div>
              {returnError && <p className="mt-2 text-xs text-status-overdue">{returnError}</p>}
              <button
                type="submit"
                disabled={returning}
                className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-accent-500 hover:text-accent-700 disabled:opacity-50"
              >
                {returning ? 'Saving…' : 'Mark returned'}
              </button>
            </form>
          )}

          {asset && !['AVAILABLE', 'ALLOCATED'].includes(asset.status) && (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              This asset can't be allocated while it's {asset.status.replace('_', ' ').toLowerCase()}.
            </p>
          )}

          {asset && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">Allocation history</p>
              {history.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No allocations recorded yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-gray-100">
                  {history.map((h) => (
                    <li key={h.id} className="py-2.5 text-sm">
                      <p className="text-gray-900">
                        {holderLabel(h)} — {h.status === 'ACTIVE' ? 'currently holding' : 'returned'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Allocated {new Date(h.allocated_at).toLocaleDateString()}
                        {h.expected_return_date && ` · due ${new Date(h.expected_return_date).toLocaleDateString()}`}
                        {h.returned_at &&
                          ` · returned ${new Date(h.returned_at).toLocaleDateString()}${h.return_condition ? ` (${h.return_condition.toLowerCase()})` : ''}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {canManage && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">Pending transfer requests</p>
            {pendingError && <p className="mt-2 text-xs text-status-overdue">{pendingError}</p>}
            {pendingRequests.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Nothing awaiting approval.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pendingRequests.map((r) => (
                  <li key={r.id} className="rounded-md border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {r.asset_tag} — {r.asset_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {r.from_employee_name || r.from_department_name} → {r.to_employee_name || r.to_department_name}
                    </p>
                    {r.reason && <p className="mt-1 text-xs text-gray-500">"{r.reason}"</p>}
                    <p className="mt-1 text-[11px] text-gray-400">Requested by {r.requested_by_name}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, 'APPROVED')}
                        className="rounded-md bg-accent-500 px-3 py-1 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, 'REJECTED')}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:border-status-overdue hover:text-status-overdue disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default AllocationWorkspace;
