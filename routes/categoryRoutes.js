const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware'); // Pastikan Anda punya file ini

router.get('/', protect, categoryController.getAllCategories); // Hanya user terautentikasi bisa melihat

module.exports = router;