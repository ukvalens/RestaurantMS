const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/categories', menuController.getCategories);
router.post('/categories', authMiddleware, roleCheck('admin', 'manager'), menuController.createCategory);
router.get('/items', menuController.getMenuItems);
router.post('/items', authMiddleware, roleCheck('admin', 'manager'), menuController.createMenuItem);
router.put('/items/:id', authMiddleware, roleCheck('admin', 'manager'), menuController.updateMenuItem);
router.delete('/items/:id', authMiddleware, roleCheck('admin', 'manager'), menuController.deleteMenuItem);
router.post('/items/:id/image', authMiddleware, roleCheck('admin', 'manager'), upload.single('image'), menuController.uploadMenuItemImage);

module.exports = router;
