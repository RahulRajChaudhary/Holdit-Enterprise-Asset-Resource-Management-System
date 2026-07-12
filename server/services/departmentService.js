const pool = require('../db/pool');

class DepartmentError extends Error {}

async function listDepartments() {
  const result = await pool.query(
    `SELECT d.id, d.name, d.code, d.status, d.parent_department_id,
            d.head_user_id, h.name AS head_name, p.name AS parent_name
       FROM departments d
       LEFT JOIN users h ON h.id = d.head_user_id
       LEFT JOIN departments p ON p.id = d.parent_department_id
      ORDER BY d.name`
  );
  return result.rows;
}

async function createDepartment({ name, code, headUserId, parentDepartmentId }) {
  if (parentDepartmentId) {
    const parent = await pool.query('SELECT id FROM departments WHERE id = $1', [parentDepartmentId]);
    if (parent.rows.length === 0) {
      throw new DepartmentError('Selected parent department does not exist.');
    }
  }
  if (headUserId) {
    const head = await pool.query('SELECT id FROM users WHERE id = $1', [headUserId]);
    if (head.rows.length === 0) {
      throw new DepartmentError('Selected department head does not exist.');
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO departments (name, code, head_user_id, parent_department_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, code, status, head_user_id, parent_department_id`,
      [name, code, headUserId || null, parentDepartmentId || null]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new DepartmentError(`A department with code "${code}" already exists.`);
    }
    throw err;
  }
}

async function updateDepartment(id, { name, code, headUserId, parentDepartmentId, status }) {
  const existing = await pool.query('SELECT id FROM departments WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new DepartmentError('Department not found.');
  }
  if (parentDepartmentId === id) {
    throw new DepartmentError('A department cannot be its own parent.');
  }
  if (parentDepartmentId) {
    const parent = await pool.query('SELECT id FROM departments WHERE id = $1', [parentDepartmentId]);
    if (parent.rows.length === 0) {
      throw new DepartmentError('Selected parent department does not exist.');
    }
  }
  if (headUserId) {
    const head = await pool.query('SELECT id FROM users WHERE id = $1', [headUserId]);
    if (head.rows.length === 0) {
      throw new DepartmentError('Selected department head does not exist.');
    }
  }

  try {
    const result = await pool.query(
      `UPDATE departments
          SET name = COALESCE($1, name),
              code = COALESCE($2, code),
              head_user_id = $3,
              parent_department_id = $4,
              status = COALESCE($5, status),
              updated_at = now()
        WHERE id = $6
        RETURNING id, name, code, status, head_user_id, parent_department_id`,
      [name || null, code || null, headUserId || null, parentDepartmentId || null, status || null, id]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new DepartmentError(`A department with code "${code}" already exists.`);
    }
    throw err;
  }
}

module.exports = { listDepartments, createDepartment, updateDepartment, DepartmentError };
