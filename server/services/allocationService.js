const pool = require('../db/pool');
const activityLogService = require('./activityLogService');

class AllocationError extends Error {}

const HOLDER_TYPES = ['EMPLOYEE', 'DEPARTMENT'];
const RETURN_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED'];

const ALLOCATION_SELECT = `
  al.id, al.asset_id, al.holder_type, al.employee_id, al.department_id,
  al.expected_return_date, al.status, al.allocated_at, al.returned_at,
  al.return_condition, al.return_notes,
  emp.name AS employee_name, dept.name AS department_name
`;

function holderLabel(row) {
  return row.holder_type === 'EMPLOYEE' ? row.employee_name : `${row.department_name} (dept)`;
}

async function getAssetOrThrow(assetId) {
  const result = await pool.query('SELECT id, status, condition FROM assets WHERE id = $1', [assetId]);
  if (result.rows.length === 0) {
    throw new AllocationError('Asset not found.');
  }
  return result.rows[0];
}

async function getActiveAllocation(assetId) {
  const result = await pool.query(
    `SELECT ${ALLOCATION_SELECT}
       FROM allocations al
       LEFT JOIN users emp ON emp.id = al.employee_id
       LEFT JOIN departments dept ON dept.id = al.department_id
      WHERE al.asset_id = $1 AND al.status = 'ACTIVE'`,
    [assetId]
  );
  return result.rows[0] || null;
}

async function listAllocationsForAsset(assetId) {
  const result = await pool.query(
    `SELECT ${ALLOCATION_SELECT}
       FROM allocations al
       LEFT JOIN users emp ON emp.id = al.employee_id
       LEFT JOIN departments dept ON dept.id = al.department_id
      WHERE al.asset_id = $1
      ORDER BY al.allocated_at DESC`,
    [assetId]
  );
  return result.rows;
}

async function listOverdueAllocations() {
  const result = await pool.query(
    `SELECT ${ALLOCATION_SELECT}, a.asset_tag, a.name AS asset_name
       FROM allocations al
       JOIN assets a ON a.id = al.asset_id
       LEFT JOIN users emp ON emp.id = al.employee_id
       LEFT JOIN departments dept ON dept.id = al.department_id
      WHERE al.status = 'ACTIVE' AND al.expected_return_date < CURRENT_DATE
      ORDER BY al.expected_return_date`
  );
  return result.rows;
}

async function listUpcomingReturns() {
  const result = await pool.query(
    `SELECT ${ALLOCATION_SELECT}, a.asset_tag, a.name AS asset_name
       FROM allocations al
       JOIN assets a ON a.id = al.asset_id
       LEFT JOIN users emp ON emp.id = al.employee_id
       LEFT JOIN departments dept ON dept.id = al.department_id
      WHERE al.status = 'ACTIVE' AND al.expected_return_date >= CURRENT_DATE
      ORDER BY al.expected_return_date`
  );
  return result.rows;
}

async function validateHolder(holderType, employeeId, departmentId) {
  if (!HOLDER_TYPES.includes(holderType)) {
    throw new AllocationError(`"${holderType}" is not a valid holder type.`);
  }
  if (holderType === 'EMPLOYEE') {
    if (!employeeId) throw new AllocationError('Select an employee to allocate this asset to.');
    const emp = await pool.query('SELECT id FROM users WHERE id = $1', [employeeId]);
    if (emp.rows.length === 0) throw new AllocationError('Selected employee does not exist.');
  } else {
    if (!departmentId) throw new AllocationError('Select a department to allocate this asset to.');
    const dept = await pool.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
    if (dept.rows.length === 0) throw new AllocationError('Selected department does not exist.');
  }
}

async function allocateAsset({ assetId, holderType, employeeId, departmentId, expectedReturnDate, actorId }) {
  const asset = await getAssetOrThrow(assetId);

  if (asset.status === 'ALLOCATED') {
    const active = await getActiveAllocation(assetId);
    const err = new AllocationError(
      `This asset is already allocated to ${active ? holderLabel(active) : 'someone else'}. Submit a transfer request instead.`
    );
    err.conflict = true;
    err.activeAllocation = active;
    throw err;
  }
  if (asset.status !== 'AVAILABLE') {
    throw new AllocationError(`Can't allocate an asset that is ${asset.status.replace('_', ' ').toLowerCase()}.`);
  }

  await validateHolder(holderType, employeeId, departmentId);

  const client = await pool.connect();
  let inserted;
  try {
    await client.query('BEGIN');
    inserted = await client.query(
      `INSERT INTO allocations (asset_id, holder_type, employee_id, department_id, expected_return_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [assetId, holderType, holderType === 'EMPLOYEE' ? employeeId : null, holderType === 'DEPARTMENT' ? departmentId : null, expectedReturnDate || null]
    );
    await client.query(`UPDATE assets SET status = 'ALLOCATED', updated_at = now() WHERE id = $1`, [assetId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const allocation = await listAllocationsForAsset(assetId).then((rows) => rows.find((r) => r.id === inserted.rows[0].id));
  await activityLogService.log({
    actorId,
    action: 'ASSET_ASSIGNED',
    entityType: 'asset',
    entityId: assetId,
    message: `Asset assigned to ${holderLabel(allocation)}.`,
  });
  return allocation;
}

async function returnAsset({ assetId, condition, notes, actorId }) {
  const asset = await getAssetOrThrow(assetId);
  const active = await getActiveAllocation(assetId);
  if (!active) {
    throw new AllocationError('This asset is not currently allocated.');
  }
  if (condition && !RETURN_CONDITIONS.includes(condition)) {
    throw new AllocationError(`"${condition}" is not a valid condition.`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE allocations
          SET status = 'RETURNED', returned_at = now(), return_condition = $1, return_notes = $2, updated_at = now()
        WHERE id = $3`,
      [condition || null, notes || null, active.id]
    );
    await client.query(
      `UPDATE assets SET status = 'AVAILABLE', condition = COALESCE($1, condition), updated_at = now() WHERE id = $2`,
      [condition || null, assetId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await activityLogService.log({
    actorId,
    action: 'ASSET_RETURNED',
    entityType: 'asset',
    entityId: assetId,
    message: `Asset returned by ${holderLabel(active)}${condition ? ` (condition: ${condition})` : ''}.`,
  });
  return getAssetOrThrow(assetId);
}

async function requestTransfer({ assetId, toEmployeeId, toDepartmentId, reason, requestedBy }) {
  const active = await getActiveAllocation(assetId);
  if (!active) {
    throw new AllocationError("This asset isn't currently allocated, so there's nothing to transfer.");
  }
  if (!toEmployeeId && !toDepartmentId) {
    throw new AllocationError('Select who this asset should be transferred to.');
  }
  if (toEmployeeId && toDepartmentId) {
    throw new AllocationError('Transfer to either an employee or a department, not both.');
  }
  if (toEmployeeId) {
    const emp = await pool.query('SELECT id FROM users WHERE id = $1', [toEmployeeId]);
    if (emp.rows.length === 0) throw new AllocationError('Selected employee does not exist.');
    if (active.holder_type === 'EMPLOYEE' && active.employee_id === toEmployeeId) {
      throw new AllocationError('This asset is already held by that employee.');
    }
  }
  if (toDepartmentId) {
    const dept = await pool.query('SELECT id FROM departments WHERE id = $1', [toDepartmentId]);
    if (dept.rows.length === 0) throw new AllocationError('Selected department does not exist.');
    if (active.holder_type === 'DEPARTMENT' && active.department_id === toDepartmentId) {
      throw new AllocationError('This asset is already held by that department.');
    }
  }

  const result = await pool.query(
    `INSERT INTO transfer_requests (asset_id, allocation_id, to_employee_id, to_department_id, reason, requested_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, asset_id, allocation_id, to_employee_id, to_department_id, reason, status, requested_by, created_at`,
    [assetId, active.id, toEmployeeId || null, toDepartmentId || null, reason || null, requestedBy]
  );
  return result.rows[0];
}

async function listTransferRequests({ status } = {}) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT t.id, t.asset_id, t.allocation_id, t.reason, t.status, t.created_at,
            a.asset_tag, a.name AS asset_name,
            from_emp.name AS from_employee_name, from_dept.name AS from_department_name,
            to_emp.name AS to_employee_name, to_dept.name AS to_department_name,
            requester.name AS requested_by_name
       FROM transfer_requests t
       JOIN assets a ON a.id = t.asset_id
       JOIN allocations al ON al.id = t.allocation_id
       LEFT JOIN users from_emp ON from_emp.id = al.employee_id
       LEFT JOIN departments from_dept ON from_dept.id = al.department_id
       LEFT JOIN users to_emp ON to_emp.id = t.to_employee_id
       LEFT JOIN departments to_dept ON to_dept.id = t.to_department_id
       LEFT JOIN users requester ON requester.id = t.requested_by
       ${where}
      ORDER BY t.created_at DESC`,
    params
  );
  return result.rows;
}

async function decideTransfer({ id, decision, decidedBy }) {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new AllocationError(`"${decision}" is not a valid decision.`);
  }

  const existing = await pool.query('SELECT * FROM transfer_requests WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AllocationError('Transfer request not found.');
  }
  const request = existing.rows[0];
  if (request.status !== 'PENDING') {
    throw new AllocationError('This transfer request has already been decided.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE transfer_requests SET status = $1, decided_by = $2, updated_at = now() WHERE id = $3`,
      [decision, decidedBy, id]
    );

    if (decision === 'APPROVED') {
      await client.query(
        `UPDATE allocations SET status = 'RETURNED', returned_at = now(), updated_at = now() WHERE id = $1`,
        [request.allocation_id]
      );
      const holderType = request.to_employee_id ? 'EMPLOYEE' : 'DEPARTMENT';
      await client.query(
        `INSERT INTO allocations (asset_id, holder_type, employee_id, department_id)
         VALUES ($1, $2, $3, $4)`,
        [request.asset_id, holderType, request.to_employee_id, request.to_department_id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const updated = await listTransferRequests().then((rows) => rows.find((r) => r.id === id));
  await activityLogService.log({
    actorId: decidedBy,
    action: decision === 'APPROVED' ? 'TRANSFER_APPROVED' : 'TRANSFER_REJECTED',
    entityType: 'asset',
    entityId: request.asset_id,
    message: `Transfer of ${updated.asset_tag} — ${updated.asset_name} ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`,
  });
  return updated;
}

module.exports = {
  getActiveAllocation,
  listAllocationsForAsset,
  listOverdueAllocations,
  listUpcomingReturns,
  allocateAsset,
  returnAsset,
  requestTransfer,
  listTransferRequests,
  decideTransfer,
  AllocationError,
  HOLDER_TYPES,
  RETURN_CONDITIONS,
};
