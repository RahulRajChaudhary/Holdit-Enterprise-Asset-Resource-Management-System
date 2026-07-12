const express = require('express');
const activityLogController = require('../controllers/activityLogController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', activityLogController.list);

module.exports = router;
