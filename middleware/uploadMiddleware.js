// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Untuk memastikan folder ada

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan untuk Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Lokasi penyimpanan file
    },
    filename: (req, file, cb) => {
        // Memberi nama file unik (misal: asset-1234567890.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        // Gunakan nama file yang lebih deskriptif, misal: asset_[id_aset]_[timestamp].ekstensi
        // Kita akan mendapatkan ID aset dari body atau params, jadi untuk upload terpisah.
        // Untuk upload gambar aset, kita akan buat endpoint terpisah, jadi filename bisa lebih sederhana
        cb(null, 'asset-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file: hanya izinkan gambar
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar (JPG, JPEG, PNG, GIF) yang diizinkan!'), false);
    }
};

// Inisialisasi Multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasan ukuran file 5MB
    fileFilter: fileFilter
});

module.exports = upload;