const express = require('express');
const employeeController = require('../controllers/employeeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', employeeController.list);
router.patch('/:id', requireRole('ADMIN'), employeeController.update);

module.exports = router;
