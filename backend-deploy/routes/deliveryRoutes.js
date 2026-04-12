const express = require('express');
const router = express.Router();
const dc = require('../controllers/deliveryController');
const { authMiddleware, roleCheck } = require('../middleware/auth');

router.get('/', authMiddleware, dc.getDeliveries);
router.get('/drivers', authMiddleware, roleCheck('admin', 'manager', 'waiter'), dc.getDrivers);
router.get('/:id', authMiddleware, dc.getDeliveryById);
router.post('/', authMiddleware, roleCheck('admin', 'manager', 'waiter', 'customer'), dc.createDelivery);
router.put('/:id', authMiddleware, roleCheck('admin', 'manager', 'waiter', 'delivery'), dc.updateDelivery);
router.delete('/:id', authMiddleware, roleCheck('admin', 'manager'), dc.deleteDelivery);

module.exports = router;
