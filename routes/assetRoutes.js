const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Impor middleware upload Multer

// Terapkan middleware upload.single('assetImage') langsung ke route POST dan PUT
// 'assetImage' adalah nama field di form HTML yang berisi file gambar

// GET semua aset (dengan pencarian dan filter)
router.get('/', protect, assetController.getAllAssets);

// GET satu aset berdasarkan ID
router.get('/:id', protect, authorize('admin'), assetController.getAssetById);

// CREATE aset baru (dengan upload gambar opsional)
router.post('/', protect, authorize('admin'), upload.single('assetImage'), assetController.createAsset);

// UPDATE aset (dengan update gambar opsional dan penghapusan gambar lama)
router.put('/:id', protect, authorize('admin'), upload.single('assetImage'), assetController.updateAsset);

// DELETE aset (dengan penghapusan file gambar terkait)
router.delete('/:id', protect, authorize('admin'), assetController.deleteAsset);

module.exports = router;