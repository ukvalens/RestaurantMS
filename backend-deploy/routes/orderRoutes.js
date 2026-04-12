const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, roleCheck } = require('../middleware/auth');

router.post('/', authMiddleware, roleCheck('admin', 'manager', 'waiter', 'customer'), orderController.createOrder);
router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
