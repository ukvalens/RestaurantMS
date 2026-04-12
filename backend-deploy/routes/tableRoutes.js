const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authMiddleware, roleCheck } = require('../middleware/auth');

router.get('/', authMiddleware, tableController.getTables);
router.post('/', authMiddleware, roleCheck('admin', 'manager'), tableController.createTable);
router.put('/:id/status', authMiddleware, tableController.updateTableStatus);

module.exports = router;
