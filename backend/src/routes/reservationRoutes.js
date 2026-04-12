const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authMiddleware, roleCheck } = require('../middleware/auth');

router.get('/', authMiddleware, reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.put('/:id/status', authMiddleware, roleCheck('admin', 'manager'), reservationController.updateReservationStatus);

module.exports = router;
