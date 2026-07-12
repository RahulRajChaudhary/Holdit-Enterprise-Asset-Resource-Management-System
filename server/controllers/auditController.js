const auditService = require('../services/auditService');

function handleError(err, res) {
  if (err instanceof auditService.AuditError) {
    const status = err.message.endsWith('not found.') ? 404 : 409;
    return res.status(status).json({ message: err.message });
  }
  return null;
}

async function list(req, res) {
  const cycles = await auditService.listCycles();
  res.json({ cycles });
}

async function get(req, res) {
  try {
    const cycle = await auditService.getCycleDetail(req.params.id);
    res.json({ cycle });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function create(req, res) {
  const { name, location, startDate, endDate, auditorIds } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ field: 'name', message: 'Audit cycle needs a name.' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ field: 'startDate', message: 'Start and end date are required.' });
  }

  try {
    const cycleId = await auditService.createCycle({
      name,
      location,
      startDate,
      endDate,
      auditorIds,
      createdBy: req.user.userId,
    });
    const cycle = await auditService.getCycleDetail(cycleId);
    res.status(201).json({ cycle });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function markItem(req, res) {
  const { assetId, verification } = req.body;

  if (!assetId || !verification) {
    return res.status(400).json({ message: 'Select an asset and a verification result.' });
  }

  const canOverride = ['ADMIN', 'ASSET_MANAGER'].includes(req.user.role);
  if (!canOverride && !(await auditService.isAuditorOnCycle(req.params.id, req.user.userId))) {
    return res.status(403).json({ message: 'Only auditors assigned to this cycle can verify assets.' });
  }

  try {
    const cycle = await auditService.markItem({
      cycleId: req.params.id,
      assetId,
      verification,
      verifiedBy: req.user.userId,
    });
    res.json({ cycle });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function close(req, res) {
  try {
    const cycle = await auditService.closeCycle({ cycleId: req.params.id, actorId: req.user.userId });
    res.json({ cycle });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

module.exports = { list, get, create, markItem, close };
