import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import OrgSetupTabs from '../../components/OrgSetupTabs';
import { createCategory, listCategories, updateCategory } from '../../api/categories';

const FIELD_TYPES = ['text', 'number', 'date'];
const EMPTY_CUSTOM_FIELD = { key: '', label: '', type: 'text' };

function slugify(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState(null);

  async function refresh() {
    try {
      setCategories(await listCategories());
      setLoadError('');
    } catch {
      setLoadError('Could not load categories. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function addCustomField() {
    setCustomFields((fields) => [...fields, { ...EMPTY_CUSTOM_FIELD }]);
  }

  function updateCustomField(index, patch) {
    setCustomFields((fields) =>
      fields.map((f, i) => {
        if (i !== index) return f;
        const next = { ...f, ...patch };
        if (patch.label !== undefined) next.key = slugify(patch.label);
        return next;
      })
    );
  }

  function removeCustomField(index) {
    setCustomFields((fields) => fields.filter((_, i) => i !== index));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Category name is required.');
    }
    if (customFields.some((f) => !f.label.trim())) {
      return setError('Every custom field needs a label.');
    }

    setSubmitting(true);
    try {
      await createCategory({ name: name.trim(), customFields });
      setName('');
      setCustomFields([]);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the category.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(category) {
    if (!editName.trim()) {
      return setEditError({ id: category.id, message: 'Category name is required.' });
    }
    try {
      await updateCategory(category.id, { name: editName.trim() });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError({ id: category.id, message: err.response?.data?.message || 'Could not update the category.' });
    }
  }

  return (
    <AppShell title="Organization setup">
      <OrgSetupTabs />

      <form onSubmit={handleCreate} className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-sm text-gray-700">Category name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/40"
            placeholder="e.g. Laptops"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Custom fields</label>
            <button
              type="button"
              onClick={addCustomField}
              className="text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              + Add field
            </button>
          </div>

          {customFields.length === 0 ? (
            <p className="mt-2 text-xs text-gray-400">
              None yet — assets in this category will only carry the standard fields.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {customFields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => updateCustomField(i, { label: e.target.value })}
                    placeholder="Field label (e.g. RAM)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-accent-500"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomField(i, { type: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-accent-500"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCustomField(i)}
                    className="px-2 text-xs text-gray-400 hover:text-status-overdue"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-status-overdue">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading categories…</p>
        ) : loadError ? (
          <p className="p-6 text-sm text-status-overdue">{loadError}</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No categories yet → add your first one above.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((c) => (
              <li key={c.id} className="px-4 py-3">
                {editingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-accent-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(c)}
                      className="text-xs font-medium text-accent-600 hover:text-accent-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs font-medium text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.custom_fields.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {c.custom_fields.map((f) => f.label).join(' · ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      className="text-xs font-medium text-accent-600 hover:text-accent-700"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {editError?.id === c.id && <p className="mt-1 text-xs text-status-overdue">{editError.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default Categories;
