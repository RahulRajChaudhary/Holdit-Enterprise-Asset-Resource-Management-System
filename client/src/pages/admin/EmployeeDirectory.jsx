import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import OrgSetupTabs from '../../components/OrgSetupTabs';
import { listEmployees, updateEmployee } from '../../api/employees';
import { listDepartments } from '../../api/departments';

const ROLES = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'ASSET_MANAGER', label: 'Asset Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rowError, setRowError] = useState(null);

  async function refresh() {
    try {
      const [emps, depts] = await Promise.all([listEmployees(), listDepartments()]);
      setEmployees(emps);
      setDepartments(depts);
      setLoadError('');
    } catch {
      setLoadError('Could not load the employee directory. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRoleChange(employee, role) {
    setRowError(null);
    try {
      await updateEmployee(employee.id, { role });
      refresh();
    } catch (err) {
      setRowError({ id: employee.id, message: err.response?.data?.message || 'Could not update the role.' });
    }
  }

  async function handleDepartmentChange(employee, departmentId) {
    setRowError(null);
    try {
      await updateEmployee(employee.id, { departmentId: departmentId || null });
      refresh();
    } catch (err) {
      setRowError({ id: employee.id, message: err.response?.data?.message || 'Could not update the department.' });
    }
  }

  async function handleStatusToggle(employee) {
    setRowError(null);
    const nextStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateEmployee(employee.id, { status: nextStatus });
      refresh();
    } catch (err) {
      setRowError({ id: employee.id, message: err.response?.data?.message || 'Could not update the status.' });
    }
  }

  return (
    <AppShell title="Organization setup">
      <OrgSetupTabs />

      <p className="mt-6 text-sm text-gray-500">
        Promoting someone here is the only place roles get assigned — signup always creates an Employee.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading employees…</p>
        ) : loadError ? (
          <p className="p-6 text-sm text-status-overdue">{loadError}</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No employees yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 last:border-b-0 align-top">
                  <td className="px-4 py-3 text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={emp.department_id || ''}
                      onChange={(e) => handleDepartmentChange(emp, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-accent-500"
                    >
                      <option value="">Unassigned</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={emp.role}
                      onChange={(e) => handleRoleChange(emp, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-accent-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {rowError?.id === emp.id && (
                      <p className="mt-1 text-xs text-status-overdue">{rowError.message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(emp)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        emp.status === 'ACTIVE'
                          ? 'bg-status-available/10 text-status-available'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
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

export default EmployeeDirectory;
