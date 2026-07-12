const express = require('express');
const allocationController = require('../controllers/allocationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/overdue', allocationController.overdue);
router.get('/upcoming-returns', allocationController.upcomingReturns);
router.get('/transfer-requests', allocationController.listTransferRequests);
router.post('/transfer-requests', allocationController.requestTransfer);
router.patch(
  '/transfer-requests/:id',
  requireRole('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'),
  allocationController.decideTransfer
);

router.get('/asset/:assetId', allocationController.listForAsset);
router.get('/mine', allocationController.myAllocations);
router.get('/department', requireRole('DEPARTMENT_HEAD', 'ADMIN'), allocationController.departmentAllocations);
router.get('/return-requests', requireRole('ASSET_MANAGER', 'ADMIN'), allocationController.listReturnRequests);
router.post('/', requireRole('ASSET_MANAGER', 'ADMIN'), allocationController.allocate);
router.post('/return', requireRole('ASSET_MANAGER', 'ADMIN'), allocationController.returnAsset);
router.post('/request-return', allocationController.requestReturn);

module.exports = router;
