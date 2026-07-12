const STATUS_META = {
  AVAILABLE: { label: 'Available', className: 'bg-status-available/10 text-status-available' },
  ALLOCATED: { label: 'Allocated', className: 'bg-status-allocated/10 text-status-allocated' },
  RESERVED: { label: 'Reserved', className: 'bg-status-reserved/10 text-status-reserved' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', className: 'bg-status-maintenance/10 text-status-maintenance' },
  OVERDUE: { label: 'Overdue', className: 'bg-status-overdue/10 text-status-overdue' },
  LOST: { label: 'Lost', className: 'bg-status-lost/10 text-status-lost' },
  RETIRED: { label: 'Retired', className: 'bg-status-lost/10 text-status-lost' },
  DISPOSED: { label: 'Disposed', className: 'bg-status-lost/10 text-status-lost' },
  UPCOMING: { label: 'Upcoming', className: 'bg-status-reserved/10 text-status-reserved' },
  ONGOING: { label: 'Ongoing', className: 'bg-status-allocated/10 text-status-allocated' },
  COMPLETED: { label: 'Completed', className: 'bg-status-lost/10 text-status-lost' },
  CANCELLED: { label: 'Cancelled', className: 'bg-status-overdue/10 text-status-overdue' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export default StatusBadge;
