import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import OrgSetupTabs from '../../components/OrgSetupTabs';
import { createDepartment, listDepartments, updateDepartment } from '../../api/departments';
import { listEmployees } from '../../api/employees';

const EMPTY_FORM = { name: '', code: '', headUserId: '', parentDepartmentId: '' };

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    try {
      const [depts, emps] = await Promise.all([listDepartments(), listEmployees()]);
      setDepartments(depts);
      setEmployees(emps);
      setLoadError('');
    } catch {
      setLoadError('Could not load departments. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFieldError(null);

    if (!form.name.trim()) {
      return setFieldError({ field: 'name', message: 'Department name is required.' });
    }
    if (!form.code.trim()) {
      return setFieldError({ field: 'code', message: 'Department code is required.' });
    }

    setSubmitting(true);
    try {
      await createDepartment({
        name: form.name.trim(),
        code: form.code.trim(),
        parentDepartmentId: form.parentDepartmentId || undefined,
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setFieldError({
        field: err.response?.data?.field || 'code',
        message: err.response?.data?.message || 'Could not create the department.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusToggle(dept) {
    const nextStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateDepartment(dept.id, { status: nextStatus });
    refresh();
  }

  async function handleHeadChange(dept, headUserId) {
    await updateDepartment(dept.id, { headUserId: headUserId || null });
    refresh();
  }

  return (
    <AppShell title="Organization setup">
      <OrgSetupTabs />

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`mt-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40 ${
              fieldError?.field === 'name' ? 'border-status-overdue' : 'border-gray-300'
            }`}
            placeholder="e.g. Engineering"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className={`mt-1 w-28 rounded-md border px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40 ${
              fieldError?.field === 'code' ? 'border-status-overdue' : 'border-gray-300'
            }`}
            placeholder="ENG"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Parent department</label>
          <select
            value={form.parentDepartmentId}
            onChange={(e) => setForm((f) => ({ ...f, parentDepartmentId: e.target.value }))}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40"
          >
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add department'}
        </button>
        {fieldError && <p className="w-full text-xs text-status-overdue">{fieldError.message}</p>}
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading departments…</p>
        ) : loadError ? (
          <p className="p-6 text-sm text-status-overdue">{loadError}</p>
        ) : departments.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No departments yet → add your first one above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Head</th>
                <th className="px-4 py-2.5">Parent Dept</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.code}</td>
                  <td className="px-4 py-3">
                    <select
                      value={d.head_user_id || ''}
                      onChange={(e) => handleHeadChange(d, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-accent-500"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.parent_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(d)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        d.status === 'ACTIVE'
                          ? 'bg-status-available/10 text-status-available'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {d.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

export default Departments;
