const categoryService = require('../services/categoryService');

async function list(req, res) {
  const categories = await categoryService.listCategories();
  res.json({ categories });
}

async function create(req, res) {
  const { name, customFields } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ field: 'name', message: 'Category name is required.' });
  }

  try {
    const category = await categoryService.createCategory({
      name: name.trim(),
      customFields: customFields || [],
    });
    res.status(201).json({ category });
  } catch (err) {
    if (err instanceof categoryService.CategoryError) {
      return res.status(409).json({ field: 'name', message: err.message });
    }
    throw err;
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, customFields } = req.body;

  try {
    const category = await categoryService.updateCategory(id, {
      name: name ? name.trim() : undefined,
      customFields,
    });
    res.json({ category });
  } catch (err) {
    if (err instanceof categoryService.CategoryError) {
      const status = err.message === 'Category not found.' ? 404 : 409;
      return res.status(status).json({ message: err.message });
    }
    throw err;
  }
}

module.exports = { list, create, update };
