const pool = require('../db/pool');

async function log({ actorId, action, entityType, entityId, message }) {
  await pool.query(
    `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, message) VALUES ($1, $2, $3, $4, $5)`,
    [actorId || null, action, entityType, entityId || null, message]
  );
}

async function list({ limit = 50 } = {}) {
  const result = await pool.query(
    `SELECT l.id, l.action, l.entity_type, l.entity_id, l.message, l.created_at, u.name AS actor_name
       FROM activity_logs l
       LEFT JOIN users u ON u.id = l.actor_id
      ORDER BY l.created_at DESC
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = { log, list };
