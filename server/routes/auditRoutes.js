const express = require('express');
const auditController = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', auditController.list);
router.get('/:id', auditController.get);
router.post('/', requireRole('ADMIN', 'ASSET_MANAGER'), auditController.create);
router.patch('/:id/items', auditController.markItem);
router.patch('/:id/close', requireRole('ADMIN', 'ASSET_MANAGER'), auditController.close);

module.exports = router;
