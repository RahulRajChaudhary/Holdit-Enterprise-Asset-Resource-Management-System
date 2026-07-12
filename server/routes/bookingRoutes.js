const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/active', bookingController.listActive);
router.get('/mine', bookingController.listMine);
router.get('/reminders', bookingController.listReminders);
router.get('/asset/:assetId', bookingController.listForAsset);
router.post('/', bookingController.create);
router.patch('/:id/cancel', bookingController.cancel);

module.exports = router;
