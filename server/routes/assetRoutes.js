const express = require('express');
const assetController = require('../controllers/assetController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', assetController.list);
router.get('/:id', assetController.get);
router.post('/', requireRole('ASSET_MANAGER'), assetController.create);
router.patch('/:id', requireRole('ASSET_MANAGER'), assetController.update);

module.exports = router;
