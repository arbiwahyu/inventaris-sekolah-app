const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Contoh: Hanya admin yang bisa melihat daftar user
router.get('/', protect, authorize('admin'), userController.getAllUsers);
// router.post('/', protect, authorize('admin'), userController.createUser); // Contoh untuk tambah user

module.exports = router;