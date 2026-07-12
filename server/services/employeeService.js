const pool = require('../db/pool');

class EmployeeError extends Error {}

const VALID_ROLES = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];

async function listEmployees() {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.department_id, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u.name`
  );
  return result.rows;
}

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

async function updateEmployee(id, { role, departmentId, status }) {
  if (role && !VALID_ROLES.includes(role)) {
    throw new EmployeeError(`"${role}" is not a valid role.`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new EmployeeError(`"${status}" is not a valid status.`);
  }

  const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new EmployeeError('Employee not found.');
  }

  if (departmentId) {
    const dept = await pool.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
    if (dept.rows.length === 0) {
      throw new EmployeeError('Selected department does not exist.');
    }
  }

  const result = await pool.query(
    `UPDATE users
        SET role = COALESCE($1, role),
            department_id = CASE WHEN $2::boolean THEN $3 ELSE department_id END,
            status = COALESCE($4, status),
            updated_at = now()
      WHERE id = $5
      RETURNING id, name, email, role, status, department_id`,
    [role || null, departmentId !== undefined, departmentId || null, status || null, id]
  );
  return result.rows[0];
}

module.exports = { listEmployees, updateEmployee, EmployeeError, VALID_ROLES, VALID_STATUSES };
