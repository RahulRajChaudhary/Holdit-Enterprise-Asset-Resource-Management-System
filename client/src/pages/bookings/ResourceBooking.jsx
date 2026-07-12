import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { listAssets } from '../../api/assets';
import { listBookingsForAsset, createBooking, cancelBooking } from '../../api/bookings';

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ResourceBooking() {
  const { user } = useAuth();
  const canManage = ['ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'].includes(user?.role);

  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ start: '', end: '', purpose: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    listAssets({ bookable: true })
      .then(setResources)
      .catch(() => setLoadError('Could not load bookable resources.'));
  }, []);

  useEffect(() => {
    if (!resourceId) {
      setBookings([]);
      return;
    }
    refreshBookings();
  }, [resourceId]);

  function refreshBookings() {
    listBookingsForAsset(resourceId)
      .then(setBookings)
      .catch(() => setLoadError('Could not load bookings for this resource.'));
  }

  async function handleBook(e) {
    e.preventDefault();
    setFormError('');
    if (!form.start || !form.end) {
      return setFormError('Pick a start and end time.');
    }
    setSubmitting(true);
    try {
      await createBooking({
        assetId: resourceId,
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
        purpose: form.purpose || undefined,
      });
      setForm({ start: '', end: '', purpose: '' });
      refreshBookings();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not book this slot.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(booking) {
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.id);
      refreshBookings();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  }

  const selectedResource = resources.find((r) => r.id === resourceId);
  const now = new Date();
  const defaultStart = toLocalInputValue(now);

  return (
    <AppShell title="Resource Booking">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">Resource</label>
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
        >
          <option value="">Select a bookable resource…</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.asset_tag} — {r.name}
            </option>
          ))}
        </select>
        {resources.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">
            No resources are marked bookable yet — flip "Bookable as a shared resource" on an asset first.
          </p>
        )}
        {loadError && <p className="mt-2 text-xs text-status-overdue">{loadError}</p>}
      </div>

      {selectedResource && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={handleBook} className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-1">
            <p className="text-sm font-medium text-gray-900">Book a slot</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Start</label>
                <input
                  type="datetime-local"
                  min={defaultStart}
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">End</label>
                <input
                  type="datetime-local"
                  min={form.start || defaultStart}
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Purpose (optional)</label>
                <input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
                />
              </div>
            </div>
            {formError && <p className="mt-2 text-xs text-status-overdue">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
            >
              {submitting ? 'Booking…' : 'Book a slot'}
            </button>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
            <p className="text-sm font-medium text-gray-900">
              Bookings for {selectedResource.asset_tag} — {selectedResource.name}
            </p>
            {bookings.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No bookings yet for this resource.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="text-gray-900">
                        {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.booked_by_name}
                        {b.purpose && ` · ${b.purpose}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.display_status} />
                      {(b.booked_by === user?.id || canManage) &&
                        ['UPCOMING', 'ONGOING'].includes(b.display_status) && (
                          <button
                            type="button"
                            disabled={cancellingId === b.id}
                            onClick={() => handleCancel(b)}
                            className="text-xs font-medium text-gray-400 hover:text-status-overdue disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default ResourceBooking;
