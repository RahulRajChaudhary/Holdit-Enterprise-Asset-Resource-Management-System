const pool = require('../db/pool');
const activityLogService = require('./activityLogService');

class AuditError extends Error {}

const VERIFICATIONS = ['VERIFIED', 'MISSING', 'DAMAGED'];

async function getCycleOrThrow(id) {
  const result = await pool.query('SELECT * FROM audit_cycles WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AuditError('Audit cycle not found.');
  }
  return result.rows[0];
}

async function isAuditorOnCycle(cycleId, userId) {
  const result = await pool.query(
    'SELECT 1 FROM audit_cycle_auditors WHERE cycle_id = $1 AND user_id = $2',
    [cycleId, userId]
  );
  return result.rows.length > 0;
}

async function listCycles() {
  const result = await pool.query(
    `SELECT c.id, c.name, c.location, c.start_date, c.end_date, c.status, c.closed_at, c.created_at,
            creator.name AS created_by_name,
            count(i.id)::int AS item_count,
            count(i.id) FILTER (WHERE i.verification IS NOT NULL)::int AS verified_count,
            count(i.id) FILTER (WHERE i.verification IN ('MISSING', 'DAMAGED'))::int AS discrepancy_count
       FROM audit_cycles c
       JOIN users creator ON creator.id = c.created_by
       LEFT JOIN audit_items i ON i.cycle_id = c.id
      GROUP BY c.id, creator.name
      ORDER BY c.created_at DESC`
  );
  return result.rows;
}

async function getCycleDetail(id) {
  const cycle = await getCycleOrThrow(id);

  const auditors = await pool.query(
    `SELECT u.id, u.name FROM audit_cycle_auditors aca JOIN users u ON u.id = aca.user_id WHERE aca.cycle_id = $1`,
    [id]
  );
  const items = await pool.query(
    `SELECT i.id, i.asset_id, i.verification, i.verified_by, i.verified_at,
            a.asset_tag, a.name AS asset_name, a.location AS asset_location,
            verifier.name AS verified_by_name
       FROM audit_items i
       JOIN assets a ON a.id = i.asset_id
       LEFT JOIN users verifier ON verifier.id = i.verified_by
      WHERE i.cycle_id = $1
      ORDER BY a.asset_tag`,
    [id]
  );

  return { ...cycle, auditors: auditors.rows, items: items.rows };
}

async function createCycle({ name, location, startDate, endDate, auditorIds, createdBy }) {
  if (!name || !name.trim()) {
    throw new AuditError('Audit cycle needs a name.');
  }
  if (!startDate || !endDate) {
    throw new AuditError('Start and end date are required.');
  }
  if (new Date(endDate) < new Date(startDate)) {
    throw new AuditError('End date cannot be before the start date.');
  }
  if (!Array.isArray(auditorIds) || auditorIds.length === 0) {
    throw new AuditError('Assign at least one auditor to this cycle.');
  }
  for (const auditorId of auditorIds) {
    const user = await pool.query('SELECT id FROM users WHERE id = $1', [auditorId]);
    if (user.rows.length === 0) {
      throw new AuditError('One of the selected auditors does not exist.');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cycle = await client.query(
      `INSERT INTO audit_cycles (name, location, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name.trim(), location || null, startDate, endDate, createdBy]
    );
    const cycleId = cycle.rows[0].id;

    for (const auditorId of auditorIds) {
      await client.query(
        `INSERT INTO audit_cycle_auditors (cycle_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [cycleId, auditorId]
      );
    }

    const assetFilter = location
      ? { text: 'SELECT id FROM assets WHERE location ILIKE $1 AND status <> \'DISPOSED\'', values: [`%${location}%`] }
      : { text: "SELECT id FROM assets WHERE status <> 'DISPOSED'", values: [] };
    const assets = await client.query(assetFilter.text, assetFilter.values);

    if (assets.rows.length === 0) {
      throw new AuditError('No assets match this audit scope.');
    }

    for (const asset of assets.rows) {
      await client.query(`INSERT INTO audit_items (cycle_id, asset_id) VALUES ($1, $2)`, [cycleId, asset.id]);
    }

    await client.query('COMMIT');
    return cycleId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function markItem({ cycleId, assetId, verification, verifiedBy }) {
  const cycle = await getCycleOrThrow(cycleId);
  if (cycle.status !== 'OPEN') {
    throw new AuditError('This audit cycle is already closed.');
  }
  if (!VERIFICATIONS.includes(verification)) {
    throw new AuditError(`"${verification}" is not a valid verification result.`);
  }

  const item = await pool.query('SELECT id FROM audit_items WHERE cycle_id = $1 AND asset_id = $2', [cycleId, assetId]);
  if (item.rows.length === 0) {
    throw new AuditError('This asset is not part of this audit cycle.');
  }

  await pool.query(
    `UPDATE audit_items SET verification = $1, verified_by = $2, verified_at = now(), updated_at = now() WHERE id = $3`,
    [verification, verifiedBy, item.rows[0].id]
  );

  if (['MISSING', 'DAMAGED'].includes(verification)) {
    const asset = await pool.query('SELECT asset_tag, name FROM assets WHERE id = $1', [assetId]);
    await activityLogService.log({
      actorId: verifiedBy,
      action: 'AUDIT_DISCREPANCY_FLAGGED',
      entityType: 'asset',
      entityId: assetId,
      message: `${asset.rows[0].asset_tag} — ${asset.rows[0].name} flagged ${verification.toLowerCase()} during "${cycle.name}".`,
    });
  }

  return getCycleDetail(cycleId);
}

async function closeCycle({ cycleId, actorId }) {
  const cycle = await getCycleOrThrow(cycleId);
  if (cycle.status !== 'OPEN') {
    throw new AuditError('This audit cycle is already closed.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const missing = await client.query(
      `SELECT asset_id FROM audit_items WHERE cycle_id = $1 AND verification = 'MISSING'`,
      [cycleId]
    );
    for (const row of missing.rows) {
      await client.query(`UPDATE assets SET status = 'LOST', updated_at = now() WHERE id = $1`, [row.asset_id]);
    }

    const damaged = await client.query(
      `SELECT asset_id FROM audit_items WHERE cycle_id = $1 AND verification = 'DAMAGED'`,
      [cycleId]
    );
    for (const row of damaged.rows) {
      await client.query(`UPDATE assets SET condition = 'DAMAGED', updated_at = now() WHERE id = $1`, [row.asset_id]);
    }

    await client.query(`UPDATE audit_cycles SET status = 'CLOSED', closed_at = now(), updated_at = now() WHERE id = $1`, [
      cycleId,
    ]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await activityLogService.log({
    actorId,
    action: 'AUDIT_CYCLE_CLOSED',
    entityType: 'audit_cycle',
    entityId: cycleId,
    message: `Audit cycle "${cycle.name}" closed.`,
  });

  return getCycleDetail(cycleId);
}

module.exports = {
  listCycles,
  getCycleDetail,
  createCycle,
  markItem,
  closeCycle,
  isAuditorOnCycle,
  AuditError,
  VERIFICATIONS,
};
