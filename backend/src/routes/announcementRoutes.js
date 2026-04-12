const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { getAll, create, remove } = require('../controllers/announcementController');

router.get('/', authMiddleware, getAll);
router.post('/', authMiddleware, roleCheck('admin', 'manager'), create);
router.delete('/:id', authMiddleware, roleCheck('admin', 'manager'), remove);

module.exports = router;
