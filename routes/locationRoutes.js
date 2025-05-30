const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware'); // Pastikan Anda punya file ini

router.get('/', protect, locationController.getAllLocations); // Hanya user terautentikasi bisa melihat

module.exports = router;