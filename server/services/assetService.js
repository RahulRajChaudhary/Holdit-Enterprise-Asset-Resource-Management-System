const pool = require('../db/pool');

class AssetError extends Error {}

const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED'];

// Only the transitions that make sense as a direct, manual edit from the
// Asset Registry. Allocation/booking/maintenance/audit each own the rest of
// the lifecycle and will drive it as a side effect of their own actions, not
// through this map.
const MANUAL_STATUS_TRANSITIONS = {
  AVAILABLE: ['RETIRED', 'LOST'],
  RETIRED: ['AVAILABLE', 'DISPOSED'],
  LOST: ['AVAILABLE'],
  DISPOSED: [],
  ALLOCATED: [],
  RESERVED: [],
  UNDER_MAINTENANCE: [],
};

function assertValidManualTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return;
  const allowed = MANUAL_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AssetError(
      `Can't move an asset from ${currentStatus} to ${nextStatus} here. That transition happens through allocation, booking, or maintenance instead.`
    );
  }
}

const SELECT_FIELDS = `
  a.id, a.asset_tag, a.name, a.category_id, c.name AS category_name,
  a.serial_number, a.acquisition_date, a.acquisition_cost, a.condition,
  a.location, a.is_bookable, a.status, a.created_at, a.updated_at
`;

async function listAssets({ q, categoryId, status, location, bookable } = {}) {
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(a.asset_tag ILIKE $${params.length} OR a.name ILIKE $${params.length} OR a.serial_number ILIKE $${params.length})`);
  }
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`a.category_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`a.location ILIKE $${params.length}`);
  }
  if (bookable !== undefined) {
    params.push(bookable === 'true' || bookable === true);
    conditions.push(`a.is_bookable = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id ${where} ORDER BY a.created_at DESC`,
    params
  );
  return result.rows;
}

async function getAssetById(id) {
  const result = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id WHERE a.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new AssetError('Asset not found.');
  }
  return result.rows[0];
}

async function createAsset({ name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable }) {
  if (condition && !CONDITIONS.includes(condition)) {
    throw new AssetError(`"${condition}" is not a valid condition.`);
  }
  if (categoryId) {
    const category = await pool.query('SELECT id FROM asset_categories WHERE id = $1', [categoryId]);
    if (category.rows.length === 0) {
      throw new AssetError('Selected category does not exist.');
    }
  }

  const result = await pool.query(
    `INSERT INTO assets (name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_bookable)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'GOOD'), $7, COALESCE($8, false))
     RETURNING id, asset_tag`,
    [name, categoryId || null, serialNumber || null, acquisitionDate || null, acquisitionCost || null, condition || null, location || null, isBookable]
  );
  return getAssetById(result.rows[0].id);
}

async function updateAsset(id, { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable, status }) {
  const existing = await getAssetById(id);

  if (condition && !CONDITIONS.includes(condition)) {
    throw new AssetError(`"${condition}" is not a valid condition.`);
  }
  if (categoryId) {
    const category = await pool.query('SELECT id FROM asset_categories WHERE id = $1', [categoryId]);
    if (category.rows.length === 0) {
      throw new AssetError('Selected category does not exist.');
    }
  }
  if (status) {
    assertValidManualTransition(existing.status, status);
  }

  await pool.query(
    `UPDATE assets
        SET name = COALESCE($1, name),
            category_id = CASE WHEN $2::boolean THEN $3 ELSE category_id END,
            serial_number = COALESCE($4, serial_number),
            acquisition_date = COALESCE($5, acquisition_date),
            acquisition_cost = COALESCE($6, acquisition_cost),
            condition = COALESCE($7, condition),
            location = COALESCE($8, location),
            is_bookable = COALESCE($9, is_bookable),
            status = COALESCE($10, status),
            updated_at = now()
      WHERE id = $11`,
    [
      name || null,
      categoryId !== undefined,
      categoryId || null,
      serialNumber || null,
      acquisitionDate || null,
      acquisitionCost || null,
      condition || null,
      location || null,
      isBookable === undefined ? null : isBookable,
      status || null,
      id,
    ]
  );
  return getAssetById(id);
}

module.exports = { listAssets, getAssetById, createAsset, updateAsset, AssetError, CONDITIONS, MANUAL_STATUS_TRANSITIONS };
