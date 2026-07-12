import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { listAssets } from '../../api/assets';
import { listCategories } from '../../api/categories';

const STATUS_OPTIONS = [
  'AVAILABLE',
  'ALLOCATED',
  'RESERVED',
  'UNDER_MAINTENANCE',
  'LOST',
  'RETIRED',
  'DISPOSED',
];

function AssetList() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      listAssets({ q: q || undefined, categoryId: categoryId || undefined, status: status || undefined })
        .then((data) => {
          setAssets(data);
          setLoadError('');
        })
        .catch(() => setLoadError('Could not load assets. Check your connection and try again.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, categoryId, status]);

  return (
    <AppShell title="Assets">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by tag, name, or serial…"
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        {user?.role === 'ASSET_MANAGER' && (
          <Link
            to="/assets/new"
            className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            + Register asset
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading assets…</p>
        ) : loadError ? (
          <p className="p-6 text-sm text-status-overdue">{loadError}</p>
        ) : assets.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            {q || categoryId || status ? 'No assets match these filters.' : 'No assets yet → register your first asset.'}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Tag</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/assets/${a.id}`} className="font-medium text-accent-600 hover:text-accent-700">
                      {a.asset_tag}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.category_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.location || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

export default AssetList;
