const express = require('express');
const maintenanceController = require('../controllers/maintenanceController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/count-active', maintenanceController.countActive);
router.get('/asset/:assetId', maintenanceController.listForAsset);
router.get('/', maintenanceController.listAll);
router.post('/', maintenanceController.raise);
router.patch('/:id/decide', requireRole('ASSET_MANAGER', 'ADMIN'), maintenanceController.decide);
router.patch('/:id/assign-technician', requireRole('ASSET_MANAGER', 'ADMIN'), maintenanceController.assignTechnician);
router.patch('/:id/start', requireRole('ASSET_MANAGER', 'ADMIN'), maintenanceController.startProgress);
router.patch('/:id/resolve', requireRole('ASSET_MANAGER', 'ADMIN'), maintenanceController.resolve);

module.exports = router;
