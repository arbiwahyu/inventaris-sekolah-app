const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Hanya Admin yang bisa mengakses laporan
router.get('/summary', protect, authorize('admin','staff'), reportController.getInventorySummary);
router.get('/assets-by-category', protect, authorize('admin','staff'), reportController.getAssetsByCategory);
router.get('/assets-by-location', protect, authorize('admin','staff'), reportController.getAssetsByLocation);
router.get('/borrowed-assets-summary', protect, authorize('admin','staff'), reportController.getBorrowedAssetsSummary);

module.exports = router;