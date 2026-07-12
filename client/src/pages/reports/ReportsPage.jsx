import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '../../components/AppShell';
import { getReportSummary } from '../../api/reports';

const ACCENT = '#0F6E56';

function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ChartCard({ title, data, dataKey, labelKey, exportName }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <button
          type="button"
          onClick={() => downloadCsv(exportName, data)}
          className="text-xs font-medium text-accent-600 hover:text-accent-700"
        >
          Export CSV
        </button>
      </div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey={dataKey} fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ListCard({ title, rows, render, exportName, emptyText }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <button
          type="button"
          onClick={() => downloadCsv(exportName, rows)}
          className="text-xs font-medium text-accent-600 hover:text-accent-700"
        >
          Export CSV
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {rows.map((row, i) => (
            <li key={i} className="py-2 text-sm text-gray-700">
              {render(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportsPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getReportSummary()
      .then(setData)
      .catch(() => setLoadError('Could not load reports. Check your connection and try again.'));
  }, []);

  if (loadError) return <AppShell title="Reports & Analytics"><p className="text-sm text-status-overdue">{loadError}</p></AppShell>;
  if (!data) return <AppShell title="Reports & Analytics"><p className="text-sm text-gray-500">Loading…</p></AppShell>;

  const heatmapData = data.bookingHeatmap.map((h) => ({ ...h, label: `${h.hour}:00` }));

  return (
    <AppShell title="Reports & Analytics">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Utilization by department"
          data={data.utilizationByDepartment}
          dataKey="active_allocations"
          labelKey="department"
          exportName="utilization-by-department.csv"
        />
        <ChartCard
          title="Maintenance frequency by asset"
          data={data.maintenanceFrequency.map((r) => ({ ...r, label: r.asset_tag }))}
          dataKey="request_count"
          labelKey="label"
          exportName="maintenance-frequency.csv"
        />
        <ChartCard
          title="Resource booking heatmap (by hour)"
          data={heatmapData}
          dataKey="bookings"
          labelKey="label"
          exportName="booking-heatmap.csv"
        />

        <ListCard
          title="Most-used assets"
          rows={data.mostUsedAssets}
          exportName="most-used-assets.csv"
          emptyText="No usage recorded yet."
          render={(r) => (
            <span>
              <span className="font-medium text-gray-900">{r.asset_tag}</span> — {r.name} ·{' '}
              {r.allocation_count} allocation{r.allocation_count === 1 ? '' : 's'}, {r.booking_count} booking
              {r.booking_count === 1 ? '' : 's'}
            </span>
          )}
        />
        <ListCard
          title="Idle assets"
          rows={data.idleAssets}
          exportName="idle-assets.csv"
          emptyText="No idle assets — everything has been used."
          render={(r) => (
            <span>
              <span className="font-medium text-gray-900">{r.asset_tag}</span> — {r.name} · never allocated or booked
            </span>
          )}
        />
        <ListCard
          title="Assets due for maintenance"
          rows={data.dueForMaintenance}
          exportName="due-for-maintenance.csv"
          emptyText="Nothing open right now."
          render={(r) => (
            <span>
              <span className="font-medium text-gray-900">{r.asset_tag}</span> — {r.name} · {r.status.replace('_', ' ').toLowerCase()} ({r.priority.toLowerCase()})
            </span>
          )}
        />
        <ListCard
          title="Assets nearing retirement"
          rows={data.nearingRetirement}
          exportName="nearing-retirement.csv"
          emptyText="No assets are approaching end of life."
          render={(r) => (
            <span>
              <span className="font-medium text-gray-900">{r.asset_tag}</span> — {r.name} · acquired{' '}
              {new Date(r.acquisition_date).toLocaleDateString()}
            </span>
          )}
        />
      </div>
    </AppShell>
  );
}

export default ReportsPage;
