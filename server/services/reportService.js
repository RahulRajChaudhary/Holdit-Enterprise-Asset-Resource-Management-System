const pool = require('../db/pool');

async function utilizationByDepartment() {
  const result = await pool.query(`
    SELECT d.name AS department, count(al.id)::int AS active_allocations
      FROM departments d
      LEFT JOIN allocations al ON al.status = 'ACTIVE' AND (
        (al.holder_type = 'DEPARTMENT' AND al.department_id = d.id) OR
        (al.holder_type = 'EMPLOYEE' AND al.employee_id IN (SELECT id FROM users WHERE department_id = d.id))
      )
     GROUP BY d.name
     ORDER BY active_allocations DESC
  `);
  return result.rows;
}

async function mostUsedAssets(limit = 5) {
  const result = await pool.query(
    `SELECT * FROM (
       SELECT a.id, a.asset_tag, a.name,
              (SELECT count(*) FROM allocations al WHERE al.asset_id = a.id)::int AS allocation_count,
              (SELECT count(*) FROM bookings b WHERE b.asset_id = a.id)::int AS booking_count
         FROM assets a
     ) usage
     ORDER BY (usage.allocation_count + usage.booking_count) DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function idleAssets(limit = 5) {
  const result = await pool.query(
    `SELECT a.id, a.asset_tag, a.name, a.created_at
       FROM assets a
      WHERE NOT EXISTS (SELECT 1 FROM allocations al WHERE al.asset_id = a.id)
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.asset_id = a.id)
        AND a.status NOT IN ('RETIRED', 'DISPOSED')
      ORDER BY a.created_at
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function maintenanceFrequency(limit = 10) {
  const result = await pool.query(
    `SELECT a.asset_tag, a.name, count(m.id)::int AS request_count
       FROM maintenance_requests m
       JOIN assets a ON a.id = m.asset_id
      GROUP BY a.id, a.asset_tag, a.name
      ORDER BY request_count DESC
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function dueForMaintenance() {
  const result = await pool.query(
    `SELECT a.asset_tag, a.name, m.status, m.priority, m.created_at
       FROM maintenance_requests m
       JOIN assets a ON a.id = m.asset_id
      WHERE m.status IN ('PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS')
      ORDER BY m.created_at`
  );
  return result.rows;
}

async function nearingRetirement(years = 3) {
  const result = await pool.query(
    `SELECT asset_tag, name, acquisition_date
       FROM assets
      WHERE acquisition_date IS NOT NULL
        AND acquisition_date < now() - ($1 || ' years')::interval
        AND status NOT IN ('RETIRED', 'DISPOSED')
      ORDER BY acquisition_date`,
    [years]
  );
  return result.rows;
}

async function bookingHeatmap() {
  const result = await pool.query(
    `SELECT extract(hour FROM start_time)::int AS hour, count(*)::int AS bookings
       FROM bookings
      WHERE status = 'CONFIRMED'
      GROUP BY hour
      ORDER BY hour`
  );
  const byHour = new Map(result.rows.map((r) => [r.hour, r.bookings]));
  return Array.from({ length: 24 }, (_, hour) => ({ hour, bookings: byHour.get(hour) || 0 }));
}

module.exports = {
  utilizationByDepartment,
  mostUsedAssets,
  idleAssets,
  maintenanceFrequency,
  dueForMaintenance,
  nearingRetirement,
  bookingHeatmap,
};
