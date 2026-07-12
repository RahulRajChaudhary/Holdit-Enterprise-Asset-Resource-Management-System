const express = require('express');
const categoryController = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', categoryController.list);
router.post('/', requireRole('ADMIN'), categoryController.create);
router.patch('/:id', requireRole('ADMIN'), categoryController.update);

module.exports = router;
