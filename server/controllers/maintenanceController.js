const maintenanceService = require('../services/maintenanceService');

function handleError(err, res) {
  if (err instanceof maintenanceService.MaintenanceError) {
    const status = err.message.endsWith('not found.') ? 404 : 409;
    return res.status(status).json({ message: err.message });
  }
  return null;
}

async function listForAsset(req, res) {
  const rows = await maintenanceService.listForAsset(req.params.assetId);
  res.json({ requests: rows });
}

async function listAll(req, res) {
  const { status } = req.query;
  const rows = await maintenanceService.listAll({ status });
  res.json({ requests: rows });
}

async function countActive(req, res) {
  const count = await maintenanceService.countActive();
  res.json({ count });
}

async function raise(req, res) {
  const { assetId, issueDescription, priority } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select an asset to raise a request for.' });
  }
  if (!issueDescription || !issueDescription.trim()) {
    return res.status(400).json({ field: 'issueDescription', message: 'Describe the issue before submitting.' });
  }

  try {
    const request = await maintenanceService.raiseRequest({
      assetId,
      issueDescription,
      priority,
      raisedBy: req.user.userId,
    });
    res.status(201).json({ request });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function decide(req, res) {
  const { decision } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ field: 'decision', message: 'Decision must be Approved or Rejected.' });
  }

  try {
    const request = await maintenanceService.decide({ id: req.params.id, decision, decidedBy: req.user.userId });
    res.json({ request });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function assignTechnician(req, res) {
  const { technicianName } = req.body;
  try {
    const request = await maintenanceService.assignTechnician({ id: req.params.id, technicianName });
    res.json({ request });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function startProgress(req, res) {
  try {
    const request = await maintenanceService.startProgress({ id: req.params.id });
    res.json({ request });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

async function resolve(req, res) {
  try {
    const request = await maintenanceService.resolve({ id: req.params.id, actorId: req.user.userId });
    res.json({ request });
  } catch (err) {
    if (handleError(err, res)) return;
    throw err;
  }
}

module.exports = { listForAsset, listAll, countActive, raise, decide, assignTechnician, startProgress, resolve };
