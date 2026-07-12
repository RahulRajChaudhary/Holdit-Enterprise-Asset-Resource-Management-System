const departmentService = require('../services/departmentService');

async function list(req, res) {
  const departments = await departmentService.listDepartments();
  res.json({ departments });
}

async function create(req, res) {
  const { name, code, headUserId, parentDepartmentId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ field: 'name', message: 'Department name is required.' });
  }
  if (!code || !code.trim()) {
    return res.status(400).json({ field: 'code', message: 'Department code is required.' });
  }

  try {
    const department = await departmentService.createDepartment({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      headUserId,
      parentDepartmentId,
    });
    res.status(201).json({ department });
  } catch (err) {
    if (err instanceof departmentService.DepartmentError) {
      return res.status(409).json({ field: 'code', message: err.message });
    }
    throw err;
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, code, headUserId, parentDepartmentId, status } = req.body;

  if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ field: 'status', message: 'Status must be Active or Inactive.' });
  }

  try {
    const department = await departmentService.updateDepartment(id, {
      name: name ? name.trim() : undefined,
      code: code ? code.trim().toUpperCase() : undefined,
      headUserId,
      parentDepartmentId,
      status,
    });
    res.json({ department });
  } catch (err) {
    if (err instanceof departmentService.DepartmentError) {
      const status = err.message === 'Department not found.' ? 404 : 409;
      return res.status(status).json({ message: err.message });
    }
    throw err;
  }
}

module.exports = { list, create, update };
