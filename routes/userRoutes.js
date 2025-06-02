const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Contoh: Hanya admin yang bisa melihat daftar user
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.post('/', protect, authorize('admin'), userController.createUser); // PASTIKAN INI TIDAK DIKOMENTARI
router.get('/:id', protect, authorize('admin'), userController.getUserById);
router.put('/:id', protect, authorize('admin'), userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

// router.post('/', protect, authorize('admin'), userController.createUser); // Contoh untuk tambah user

module.exports = router;