import client from './client';

export async function listBookingsForAsset(assetId) {
  const { data } = await client.get(`/bookings/asset/${assetId}`);
  return data.bookings;
}

export async function listActiveBookings() {
  const { data } = await client.get('/bookings/active');
  return data.bookings;
}

export async function listBookingReminders() {
  const { data } = await client.get('/bookings/reminders');
  return data.bookings;
}

export async function createBooking(payload) {
  const { data } = await client.post('/bookings', payload);
  return data.booking;
}

export async function cancelBooking(id) {
  const { data } = await client.patch(`/bookings/${id}/cancel`);
  return data.booking;
}
