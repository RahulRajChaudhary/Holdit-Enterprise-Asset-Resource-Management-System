const bookingService = require('../services/bookingService');

function handleBookingError(err, res) {
  if (err instanceof bookingService.BookingError) {
    const status = err.message === 'Asset not found.' || err.message === 'Booking not found.' ? 404 : 409;
    return res.status(status).json({ message: err.message });
  }
  return null;
}

async function listForAsset(req, res) {
  const rows = await bookingService.listBookingsForAsset(req.params.assetId);
  res.json({ bookings: rows });
}

async function listActive(req, res) {
  const rows = await bookingService.listActiveBookings();
  res.json({ bookings: rows });
}

async function listMine(req, res) {
  const rows = await bookingService.listMyBookings(req.user.userId);
  res.json({ bookings: rows });
}

async function listReminders(req, res) {
  const rows = await bookingService.listUpcomingReminders();
  res.json({ bookings: rows });
}

async function create(req, res) {
  const { assetId, startTime, endTime, purpose } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select a resource to book.' });
  }

  try {
    const booking = await bookingService.createBooking({
      assetId,
      bookedBy: req.user.userId,
      startTime,
      endTime,
      purpose,
    });
    res.status(201).json({ booking });
  } catch (err) {
    if (handleBookingError(err, res)) return;
    throw err;
  }
}

async function cancel(req, res) {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.userId);
    res.json({ booking });
  } catch (err) {
    if (handleBookingError(err, res)) return;
    throw err;
  }
}

module.exports = { listForAsset, listActive, listMine, listReminders, create, cancel };
