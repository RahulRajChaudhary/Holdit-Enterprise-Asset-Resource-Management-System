import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { createAsset } from '../../api/assets';
import { listCategories } from '../../api/categories';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  serialNumber: '',
  acquisitionDate: '',
  acquisitionCost: '',
  condition: 'GOOD',
  location: '',
  isBookable: false,
};

function AssetRegister() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError(null);

    if (!form.name.trim()) {
      return setFieldError({ field: 'name', message: 'Asset name is required.' });
    }
    if (form.acquisitionCost && Number(form.acquisitionCost) <= 0) {
      return setFieldError({ field: 'acquisitionCost', message: 'Acquisition cost must be a positive number.' });
    }
    if (form.acquisitionDate && new Date(form.acquisitionDate) > new Date()) {
      return setFieldError({ field: 'acquisitionDate', message: 'Acquisition date cannot be in the future.' });
    }

    setSubmitting(true);
    try {
      const asset = await createAsset({
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        serialNumber: form.serialNumber || undefined,
        acquisitionDate: form.acquisitionDate || undefined,
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
        condition: form.condition,
        location: form.location || undefined,
        isBookable: form.isBookable,
      });
      navigate(`/assets/${asset.id}`);
    } catch (err) {
      setFieldError({
        field: err.response?.data?.field || 'name',
        message: err.response?.data?.message || 'Could not register the asset.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Register asset">
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs text-gray-500">
          The asset tag (AF-0001 format) is generated automatically once you save.
        </p>

        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40 ${
              fieldError?.field === 'name' ? 'border-status-overdue' : 'border-gray-300'
            }`}
            placeholder="e.g. Dell Latitude 5440"
          />
          {fieldError?.field === 'name' && <p className="mt-1 text-xs text-status-overdue">{fieldError.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => set({ categoryId: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => set({ condition: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            >
              {['NEW', 'GOOD', 'FAIR', 'DAMAGED'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Serial number</label>
            <input
              value={form.serialNumber}
              onChange={(e) => set({ serialNumber: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Location</label>
            <input
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
              placeholder="e.g. Bengaluru HQ, Floor 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Acquisition date</label>
            <input
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => set({ acquisitionDate: e.target.value })}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent-500 ${
                fieldError?.field === 'acquisitionDate' ? 'border-status-overdue' : 'border-gray-300'
              }`}
            />
            {fieldError?.field === 'acquisitionDate' && (
              <p className="mt-1 text-xs text-status-overdue">{fieldError.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700">Acquisition cost</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.acquisitionCost}
              onChange={(e) => set({ acquisitionCost: e.target.value })}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent-500 ${
                fieldError?.field === 'acquisitionCost' ? 'border-status-overdue' : 'border-gray-300'
              }`}
            />
            {fieldError?.field === 'acquisitionCost' && (
              <p className="mt-1 text-xs text-status-overdue">{fieldError.message}</p>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isBookable}
            onChange={(e) => set({ isBookable: e.target.checked })}
            className="rounded border-gray-300 text-accent-500 focus:ring-accent-500/40"
          />
          Bookable as a shared resource
        </label>

        {fieldError && !['name', 'acquisitionDate', 'acquisitionCost'].includes(fieldError.field) && (
          <p className="text-xs text-status-overdue">{fieldError.message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
        >
          {submitting ? 'Registering…' : 'Register asset'}
        </button>
      </form>
    </AppShell>
  );
}

export default AssetRegister;
