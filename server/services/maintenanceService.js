const pool = require('../db/pool');
const activityLogService = require('./activityLogService');

class MaintenanceError extends Error {}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const OPEN_STATUSES = ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'];
const BLOCKED_ASSET_STATUSES = ['LOST', 'RETIRED', 'DISPOSED'];

const SELECT_FIELDS = `
  m.id, m.asset_id, m.raised_by, m.issue_description, m.priority, m.status,
  m.technician_name, m.decided_by, m.resolved_at, m.created_at, m.updated_at,
  a.asset_tag, a.name AS asset_name, raiser.name AS raised_by_name
`;

async function getAssetOrThrow(assetId) {
  const result = await pool.query('SELECT id, status FROM assets WHERE id = $1', [assetId]);
  if (result.rows.length === 0) {
    throw new MaintenanceError('Asset not found.');
  }
  return result.rows[0];
}

async function getRequestOrThrow(id) {
  const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new MaintenanceError('Maintenance request not found.');
  }
  return result.rows[0];
}

async function listForAsset(assetId) {
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS}
       FROM maintenance_requests m
       JOIN assets a ON a.id = m.asset_id
       JOIN users raiser ON raiser.id = m.raised_by
      WHERE m.asset_id = $1
      ORDER BY m.created_at DESC`,
    [assetId]
  );
  return result.rows;
}

async function listAll({ status } = {}) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`m.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT ${SELECT_FIELDS}
       FROM maintenance_requests m
       JOIN assets a ON a.id = m.asset_id
       JOIN users raiser ON raiser.id = m.raised_by
       ${where}
      ORDER BY m.created_at DESC`,
    params
  );
  return result.rows;
}

async function countActive() {
  const result = await pool.query(
    `SELECT count(*)::int AS count FROM maintenance_requests WHERE status IN ('APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS')`
  );
  return result.rows[0].count;
}

async function raiseRequest({ assetId, issueDescription, priority, raisedBy }) {
  const asset = await getAssetOrThrow(assetId);
  if (BLOCKED_ASSET_STATUSES.includes(asset.status)) {
    throw new MaintenanceError(`Can't raise a maintenance request for an asset that is ${asset.status.toLowerCase()}.`);
  }
  if (!issueDescription || !issueDescription.trim()) {
    throw new MaintenanceError('Describe the issue before submitting.');
  }
  if (priority && !PRIORITIES.includes(priority)) {
    throw new MaintenanceError(`"${priority}" is not a valid priority.`);
  }

  const existingOpen = await pool.query(
    `SELECT id FROM maintenance_requests WHERE asset_id = $1 AND status = ANY($2::text[])`,
    [assetId, OPEN_STATUSES]
  );
  if (existingOpen.rows.length > 0) {
    throw new MaintenanceError('This asset already has an open maintenance request.');
  }

  const result = await pool.query(
    `INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority)
     VALUES ($1, $2, $3, COALESCE($4, 'MEDIUM'))
     RETURNING id`,
    [assetId, raisedBy, issueDescription.trim(), priority || null]
  );
  return listForAsset(assetId).then((rows) => rows.find((r) => r.id === result.rows[0].id));
}

async function decide({ id, decision, decidedBy }) {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new MaintenanceError(`"${decision}" is not a valid decision.`);
  }
  const request = await getRequestOrThrow(id);
  if (request.status !== 'PENDING') {
    throw new MaintenanceError('This request has already been decided.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE maintenance_requests SET status = $1, decided_by = $2, updated_at = now() WHERE id = $3`,
      [decision, decidedBy, id]
    );
    if (decision === 'APPROVED') {
      await client.query(`UPDATE assets SET status = 'UNDER_MAINTENANCE', updated_at = now() WHERE id = $1`, [
        request.asset_id,
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const updated = await getRequestOrThrow(id);
  await activityLogService.log({
    actorId: decidedBy,
    action: decision === 'APPROVED' ? 'MAINTENANCE_APPROVED' : 'MAINTENANCE_REJECTED',
    entityType: 'maintenance_request',
    entityId: id,
    message: `Maintenance request for ${updated.asset_tag} — ${updated.asset_name} ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`,
  });
  return updated;
}

async function assignTechnician({ id, technicianName }) {
  const request = await getRequestOrThrow(id);
  if (request.status !== 'APPROVED') {
    throw new MaintenanceError('A technician can only be assigned to an approved request.');
  }
  if (!technicianName || !technicianName.trim()) {
    throw new MaintenanceError('Enter the technician\'s name.');
  }

  await pool.query(
    `UPDATE maintenance_requests
        SET status = 'TECHNICIAN_ASSIGNED', technician_name = $1, updated_at = now()
      WHERE id = $2`,
    [technicianName.trim(), id]
  );
  return getRequestOrThrow(id);
}

async function startProgress({ id }) {
  const request = await getRequestOrThrow(id);
  if (request.status !== 'TECHNICIAN_ASSIGNED') {
    throw new MaintenanceError('Work can only start once a technician is assigned.');
  }

  await pool.query(`UPDATE maintenance_requests SET status = 'IN_PROGRESS', updated_at = now() WHERE id = $1`, [id]);
  return getRequestOrThrow(id);
}

async function resolve({ id, actorId }) {
  const request = await getRequestOrThrow(id);
  if (!['TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
    throw new MaintenanceError("This request isn't in progress yet.");
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE maintenance_requests SET status = 'RESOLVED', resolved_at = now(), updated_at = now() WHERE id = $1`,
      [id]
    );
    await client.query(`UPDATE assets SET status = 'AVAILABLE', updated_at = now() WHERE id = $1`, [request.asset_id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const updated = await getRequestOrThrow(id);
  await activityLogService.log({
    actorId,
    action: 'MAINTENANCE_RESOLVED',
    entityType: 'maintenance_request',
    entityId: id,
    message: `Maintenance resolved for ${updated.asset_tag} — ${updated.asset_name}.`,
  });
  return updated;
}

module.exports = {
  listForAsset,
  listAll,
  countActive,
  raiseRequest,
  decide,
  assignTechnician,
  startProgress,
  resolve,
  MaintenanceError,
  PRIORITIES,
};
