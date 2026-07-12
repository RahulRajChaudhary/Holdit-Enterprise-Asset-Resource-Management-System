const assetService = require('../services/assetService');

function validateCreatable(body) {
  const { name, acquisitionDate, acquisitionCost, condition } = body;

  if (!name || !name.trim()) {
    return { field: 'name', message: 'Asset name is required.' };
  }
  if (acquisitionCost !== undefined && acquisitionCost !== null && Number(acquisitionCost) <= 0) {
    return { field: 'acquisitionCost', message: 'Acquisition cost must be a positive number.' };
  }
  if (acquisitionDate && new Date(acquisitionDate) > new Date()) {
    return { field: 'acquisitionDate', message: 'Acquisition date cannot be in the future.' };
  }
  if (condition && !assetService.CONDITIONS.includes(condition)) {
    return { field: 'condition', message: `"${condition}" is not a valid condition.` };
  }
  return null;
}

async function list(req, res) {
  const { q, categoryId, status, location, bookable } = req.query;
  const assets = await assetService.listAssets({ q, categoryId, status, location, bookable });
  res.json({ assets });
}

async function get(req, res) {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    res.json({ asset });
  } catch (err) {
    if (err instanceof assetService.AssetError) {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
}

async function create(req, res) {
  const fieldError = validateCreatable(req.body);
  if (fieldError) return res.status(400).json(fieldError);

  const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable } = req.body;

  try {
    const asset = await assetService.createAsset({
      name: name.trim(),
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      isBookable,
    });
    res.status(201).json({ asset });
  } catch (err) {
    if (err instanceof assetService.AssetError) {
      return res.status(409).json({ message: err.message });
    }
    throw err;
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable, status } = req.body;

  if (acquisitionCost !== undefined && acquisitionCost !== null && Number(acquisitionCost) <= 0) {
    return res.status(400).json({ field: 'acquisitionCost', message: 'Acquisition cost must be a positive number.' });
  }
  if (acquisitionDate && new Date(acquisitionDate) > new Date()) {
    return res.status(400).json({ field: 'acquisitionDate', message: 'Acquisition date cannot be in the future.' });
  }

  try {
    const asset = await assetService.updateAsset(id, {
      name: name ? name.trim() : undefined,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      isBookable,
      status,
    });
    res.json({ asset });
  } catch (err) {
    if (err instanceof assetService.AssetError) {
      const httpStatus = err.message === 'Asset not found.' ? 404 : 409;
      return res.status(httpStatus).json({ message: err.message });
    }
    throw err;
  }
}

module.exports = { list, get, create, update };
