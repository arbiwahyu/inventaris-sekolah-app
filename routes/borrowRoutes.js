const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Merekam peminjaman baru
router.post('/borrow', protect, borrowController.createBorrowRecord);

// Merekam pengembalian aset
router.put('/return/:borrowRecordId', protect, borrowController.returnAsset);

// Mendapatkan semua riwayat peminjaman (opsional, bisa ditambah filter)
router.get('/history', protect, borrowController.getAllBorrowRecords);

// Mendapatkan riwayat peminjaman untuk aset tertentu
router.get('/asset/:assetId/history', protect, borrowController.getAssetBorrowHistory);

module.exports = router;