const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);

// Admin user management
router.get('/users', authMiddleware, roleCheck('admin'), authController.getUsers);
router.post('/users', authMiddleware, roleCheck('admin'), authController.createUser);
router.put('/users/:id', authMiddleware, roleCheck('admin'), authController.updateUser);
router.delete('/users/:id', authMiddleware, roleCheck('admin'), authController.deleteUser);

module.exports = router;
