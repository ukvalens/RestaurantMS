const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, roleCheck } = require('../middleware/auth');

router.post('/', authMiddleware, roleCheck('admin', 'manager', 'waiter'), paymentController.createPayment);
router.get('/', authMiddleware, roleCheck('admin', 'manager'), paymentController.getPayments);

module.exports = router;
