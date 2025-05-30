const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect,authorize } = require('../middleware/authMiddleware'); // Jika ada middleware otentikasi

router.get('/', protect, assetController.getAllAssets);
router.post('/', protect,authorize('admin'), assetController.createAsset);
router.get('/:id', protect, assetController.getAssetById);
router.put('/:id', protect, authorize('admin'), assetController.updateAsset);
router.delete('/:id', protect, authorize('admin'), assetController.deleteAsset);
// ... tambahkan route untuk GET by ID, PUT, DELETE

module.exports = router;