const pool = require('../db/pool');
const activityLogService = require('./activityLogService');

class BookingError extends Error {}

const BOOKING_SELECT = `
  b.id, b.asset_id, b.booked_by, b.start_time, b.end_time, b.purpose, b.status,
  b.created_at, a.asset_tag, a.name AS asset_name, u.name AS booked_by_name
`;

function computeDisplayStatus(row, now = new Date()) {
  if (row.status === 'CANCELLED') return 'CANCELLED';
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  if (now < start) return 'UPCOMING';
  if (now <= end) return 'ONGOING';
  return 'COMPLETED';
}

async function getAssetOrThrow(assetId) {
  const result = await pool.query('SELECT id, is_bookable, status FROM assets WHERE id = $1', [assetId]);
  if (result.rows.length === 0) {
    throw new BookingError('Asset not found.');
  }
  return result.rows[0];
}

async function listBookingsForAsset(assetId) {
  const result = await pool.query(
    `SELECT ${BOOKING_SELECT}
       FROM bookings b
       JOIN assets a ON a.id = b.asset_id
       JOIN users u ON u.id = b.booked_by
      WHERE b.asset_id = $1
      ORDER BY b.start_time DESC`,
    [assetId]
  );
  return result.rows.map((r) => ({ ...r, display_status: computeDisplayStatus(r) }));
}

async function listActiveBookings() {
  const result = await pool.query(
    `SELECT ${BOOKING_SELECT}
       FROM bookings b
       JOIN assets a ON a.id = b.asset_id
       JOIN users u ON u.id = b.booked_by
      WHERE b.status = 'CONFIRMED' AND b.end_time >= now()
      ORDER BY b.start_time`
  );
  return result.rows.map((r) => ({ ...r, display_status: computeDisplayStatus(r) }));
}

async function listMyBookings(userId) {
  const result = await pool.query(
    `SELECT ${BOOKING_SELECT}
       FROM bookings b
       JOIN assets a ON a.id = b.asset_id
       JOIN users u ON u.id = b.booked_by
      WHERE b.booked_by = $1
      ORDER BY b.start_time DESC`,
    [userId]
  );
  return result.rows.map((r) => ({ ...r, display_status: computeDisplayStatus(r) }));
}

async function listUpcomingReminders(withinMinutes = 60) {
  const result = await pool.query(
    `SELECT ${BOOKING_SELECT}
       FROM bookings b
       JOIN assets a ON a.id = b.asset_id
       JOIN users u ON u.id = b.booked_by
      WHERE b.status = 'CONFIRMED'
        AND b.start_time BETWEEN now() AND now() + ($1 || ' minutes')::interval
      ORDER BY b.start_time`,
    [withinMinutes]
  );
  return result.rows.map((r) => ({ ...r, display_status: computeDisplayStatus(r) }));
}

async function createBooking({ assetId, bookedBy, startTime, endTime, purpose }) {
  const asset = await getAssetOrThrow(assetId);
  if (!asset.is_bookable) {
    throw new BookingError('This asset is not marked as a shared/bookable resource.');
  }
  if (!startTime || !endTime) {
    throw new BookingError('Start and end time are required.');
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BookingError('Start and end time must be valid dates.');
  }
  if (end <= start) {
    throw new BookingError('End time must be after start time.');
  }

  const overlap = await pool.query(
    `SELECT id FROM bookings
      WHERE asset_id = $1 AND status = 'CONFIRMED'
        AND tstzrange(start_time, end_time) && tstzrange($2, $3)`,
    [assetId, start.toISOString(), end.toISOString()]
  );
  if (overlap.rows.length > 0) {
    throw new BookingError('That slot overlaps with an existing booking for this resource.');
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, purpose)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [assetId, bookedBy, start.toISOString(), end.toISOString(), purpose || null]
    );
    const booking = await listBookingsForAsset(assetId).then((rows) => rows.find((r) => r.id === result.rows[0].id));
    await activityLogService.log({
      actorId: bookedBy,
      action: 'BOOKING_CONFIRMED',
      entityType: 'booking',
      entityId: booking.id,
      message: `Booking confirmed for ${booking.asset_tag} — ${booking.asset_name} (${start.toLocaleString()} to ${end.toLocaleString()}).`,
    });
    return booking;
  } catch (err) {
    if (err.code === '23P01') {
      throw new BookingError('That slot overlaps with an existing booking for this resource.');
    }
    throw err;
  }
}

async function cancelBooking(id, actorId) {
  const existing = await pool.query('SELECT id, status, asset_id FROM bookings WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new BookingError('Booking not found.');
  }
  if (existing.rows[0].status === 'CANCELLED') {
    throw new BookingError('This booking is already cancelled.');
  }

  await pool.query(`UPDATE bookings SET status = 'CANCELLED', updated_at = now() WHERE id = $1`, [id]);
  const booking = await listBookingsForAsset(existing.rows[0].asset_id).then((rows) => rows.find((r) => r.id === id));
  await activityLogService.log({
    actorId,
    action: 'BOOKING_CANCELLED',
    entityType: 'booking',
    entityId: id,
    message: `Booking cancelled for ${booking.asset_tag} — ${booking.asset_name}.`,
  });
  return booking;
}

module.exports = {
  listBookingsForAsset,
  listActiveBookings,
  listMyBookings,
  listUpcomingReminders,
  createBooking,
  cancelBooking,
  computeDisplayStatus,
  BookingError,
};
