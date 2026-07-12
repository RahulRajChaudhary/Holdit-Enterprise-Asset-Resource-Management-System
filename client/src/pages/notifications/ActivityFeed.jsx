import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { listActivityLogs } from '../../api/activityLogs';
import { listOverdueAllocations } from '../../api/allocations';
import { listBookingReminders } from '../../api/bookings';

const ACTION_CATEGORY = {
  ASSET_ASSIGNED: 'ACTIVITY',
  ASSET_RETURNED: 'ACTIVITY',
  TRANSFER_APPROVED: 'APPROVAL',
  TRANSFER_REJECTED: 'APPROVAL',
  MAINTENANCE_APPROVED: 'APPROVAL',
  MAINTENANCE_REJECTED: 'APPROVAL',
  MAINTENANCE_RESOLVED: 'APPROVAL',
  AUDIT_CYCLE_CLOSED: 'APPROVAL',
  BOOKING_CONFIRMED: 'BOOKING',
  BOOKING_CANCELLED: 'BOOKING',
  AUDIT_DISCREPANCY_FLAGGED: 'ALERT',
  OVERDUE_RETURN: 'ALERT',
  BOOKING_REMINDER: 'ALERT',
};

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ALERT', label: 'Alerts' },
  { key: 'APPROVAL', label: 'Approvals' },
  { key: 'BOOKING', label: 'Bookings' },
];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('ALL');

  useEffect(() => {
    Promise.all([listActivityLogs(), listOverdueAllocations(), listBookingReminders()])
      .then(([logs, overdue, reminders]) => {
        const logEvents = logs.map((l) => ({
          id: `log-${l.id}`,
          category: ACTION_CATEGORY[l.action] || 'ACTIVITY',
          message: l.message,
          actor: l.actor_name,
          at: l.created_at,
        }));
        const overdueEvents = overdue.map((a) => ({
          id: `overdue-${a.id}`,
          category: 'ALERT',
          message: `Overdue return: ${a.asset_tag} — ${a.asset_name} was due ${new Date(a.expected_return_date).toLocaleDateString()}.`,
          actor: null,
          at: a.expected_return_date,
        }));
        const reminderEvents = reminders.map((b) => ({
          id: `reminder-${b.id}`,
          category: 'ALERT',
          message: `Booking starting soon: ${b.asset_tag} — ${b.asset_name} at ${new Date(b.start_time).toLocaleTimeString()}.`,
          actor: b.booked_by_name,
          at: b.start_time,
        }));
        const combined = [...logEvents, ...overdueEvents, ...reminderEvents].sort(
          (a, b) => new Date(b.at) - new Date(a.at)
        );
        setEvents(combined);
      })
      .catch(() => setLoadError('Could not load activity and notifications. Check your connection and try again.'));
  }, []);

  const visible = tab === 'ALL' ? events : events.filter((e) => e.category === tab);

  return (
    <AppShell title="Activity Logs & Notifications">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? 'rounded-full bg-accent-500 px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError && <p className="mt-4 text-sm text-status-overdue">{loadError}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Nothing to show here yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className={e.category === 'ALERT' ? 'text-status-overdue' : 'text-gray-900'}>{e.message}</p>
                  {e.actor && <p className="mt-0.5 text-xs text-gray-400">{e.actor}</p>}
                </div>
                <span className="shrink-0 text-xs text-gray-400">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default ActivityFeed;
