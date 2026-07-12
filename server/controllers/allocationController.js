const allocationService = require('../services/allocationService');

function handleAllocationError(err, res) {
  if (err instanceof allocationService.AllocationError) {
    const status = err.message === 'Asset not found.' ? 404 : 409;
    return res.status(status).json({ message: err.message, conflict: Boolean(err.conflict) });
  }
  return null;
}

async function listForAsset(req, res) {
  const rows = await allocationService.listAllocationsForAsset(req.params.assetId);
  res.json({ allocations: rows });
}

async function allocate(req, res) {
  const { assetId, holderType, employeeId, departmentId, expectedReturnDate } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select an asset to allocate.' });
  }

  try {
    const allocation = await allocationService.allocateAsset({
      assetId,
      holderType,
      employeeId,
      departmentId,
      expectedReturnDate,
      actorId: req.user.userId,
    });
    res.status(201).json({ allocation });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function returnAsset(req, res) {
  const { assetId, condition, notes } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select an asset to return.' });
  }

  try {
    const asset = await allocationService.returnAsset({ assetId, condition, notes, actorId: req.user.userId });
    res.json({ asset });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function myAllocations(req, res) {
  const allocations = await allocationService.listMyAllocations(req.user.userId);
  res.json({ allocations });
}

async function departmentAllocations(req, res) {
  try {
    const allocations = await allocationService.listAllocationsForMyDepartment(req.user.userId);
    res.json({ allocations });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function requestReturn(req, res) {
  const { assetId } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select an asset to request a return for.' });
  }

  try {
    const allocation = await allocationService.requestReturn({ assetId, requestedBy: req.user.userId });
    res.json({ allocation });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function listReturnRequests(req, res) {
  const allocations = await allocationService.listReturnRequests();
  res.json({ allocations });
}

async function requestTransfer(req, res) {
  const { assetId, toEmployeeId, toDepartmentId, reason } = req.body;

  if (!assetId) {
    return res.status(400).json({ field: 'assetId', message: 'Select an asset to transfer.' });
  }

  try {
    const request = await allocationService.requestTransfer({
      assetId,
      toEmployeeId,
      toDepartmentId,
      reason,
      requestedBy: req.user.userId,
    });
    res.status(201).json({ request });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function listTransferRequests(req, res) {
  const { status } = req.query;
  const requests = await allocationService.listTransferRequests({ status });
  res.json({ requests });
}

async function decideTransfer(req, res) {
  const { decision } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ field: 'decision', message: 'Decision must be Approved or Rejected.' });
  }

  try {
    const request = await allocationService.decideTransfer({
      id: req.params.id,
      decision,
      decidedBy: req.user.userId,
    });
    res.json({ request });
  } catch (err) {
    if (handleAllocationError(err, res)) return;
    throw err;
  }
}

async function overdue(req, res) {
  const allocations = await allocationService.listOverdueAllocations();
  res.json({ allocations });
}

async function upcomingReturns(req, res) {
  const allocations = await allocationService.listUpcomingReturns();
  res.json({ allocations });
}

module.exports = {
  listForAsset,
  myAllocations,
  departmentAllocations,
  allocate,
  returnAsset,
  requestReturn,
  listReturnRequests,
  requestTransfer,
  listTransferRequests,
  decideTransfer,
  overdue,
  upcomingReturns,
};
