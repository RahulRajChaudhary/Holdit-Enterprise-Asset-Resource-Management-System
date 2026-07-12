const activityLogService = require('../services/activityLogService');

async function list(req, res) {
  const logs = await activityLogService.list({ limit: 100 });
  res.json({ logs });
}

module.exports = { list };
