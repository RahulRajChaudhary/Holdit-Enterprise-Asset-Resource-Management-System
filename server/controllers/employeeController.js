const employeeService = require('../services/employeeService');

async function list(req, res) {
  const employees = await employeeService.listEmployees();
  res.json({ employees });
}

async function update(req, res) {
  const { id } = req.params;
  const { role, departmentId, status } = req.body;

  if (role && !employeeService.VALID_ROLES.includes(role)) {
    return res.status(400).json({ field: 'role', message: `"${role}" is not a valid role.` });
  }
  if (status && !employeeService.VALID_STATUSES.includes(status)) {
    return res.status(400).json({ field: 'status', message: `"${status}" is not a valid status.` });
  }

  try {
    const employee = await employeeService.updateEmployee(id, { role, departmentId, status });
    res.json({ employee });
  } catch (err) {
    if (err instanceof employeeService.EmployeeError) {
      const status = err.message === 'Employee not found.' ? 404 : 409;
      return res.status(status).json({ message: err.message });
    }
    throw err;
  }
}

module.exports = { list, update };
