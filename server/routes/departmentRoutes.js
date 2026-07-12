const express = require('express');
const departmentController = require('../controllers/departmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', departmentController.list);
router.post('/', requireRole('ADMIN'), departmentController.create);
router.patch('/:id', requireRole('ADMIN'), departmentController.update);

module.exports = router;
