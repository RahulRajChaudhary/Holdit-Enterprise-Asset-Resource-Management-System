const pool = require('../db/pool');

class CategoryError extends Error {}

const VALID_FIELD_TYPES = ['text', 'number', 'date'];

function assertValidCustomFields(customFields) {
  if (!Array.isArray(customFields)) {
    throw new CategoryError('Custom fields must be a list.');
  }
  const seenKeys = new Set();
  for (const field of customFields) {
    if (!field.key || !field.label || !field.type) {
      throw new CategoryError('Each custom field needs a key, label, and type.');
    }
    if (!VALID_FIELD_TYPES.includes(field.type)) {
      throw new CategoryError(`"${field.label}" has an unsupported field type.`);
    }
    if (seenKeys.has(field.key)) {
      throw new CategoryError(`Custom field key "${field.key}" is used more than once.`);
    }
    seenKeys.add(field.key);
  }
}

async function listCategories() {
  const result = await pool.query(
    'SELECT id, name, custom_fields, created_at, updated_at FROM asset_categories ORDER BY name'
  );
  return result.rows;
}

async function createCategory({ name, customFields }) {
  assertValidCustomFields(customFields);

  try {
    const result = await pool.query(
      `INSERT INTO asset_categories (name, custom_fields)
       VALUES ($1, $2::jsonb)
       RETURNING id, name, custom_fields, created_at, updated_at`,
      [name, JSON.stringify(customFields)]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new CategoryError(`A category named "${name}" already exists.`);
    }
    throw err;
  }
}

async function updateCategory(id, { name, customFields }) {
  const existing = await pool.query('SELECT id FROM asset_categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new CategoryError('Category not found.');
  }
  if (customFields !== undefined) {
    assertValidCustomFields(customFields);
  }

  try {
    const result = await pool.query(
      `UPDATE asset_categories
          SET name = COALESCE($1, name),
              custom_fields = COALESCE($2::jsonb, custom_fields),
              updated_at = now()
        WHERE id = $3
        RETURNING id, name, custom_fields, created_at, updated_at`,
      [name || null, customFields !== undefined ? JSON.stringify(customFields) : null, id]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new CategoryError(`A category named "${name}" already exists.`);
    }
    throw err;
  }
}

module.exports = { listCategories, createCategory, updateCategory, CategoryError };
