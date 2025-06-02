// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token;
    // Cek jika header Authorization ada dan berformat Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Jika tidak ada token, user tidak terautentikasi
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verifikasi token menggunakan JWT_SECRET dari variabel lingkungan
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Tambahkan informasi user yang didekode ke objek request untuk digunakan di controller
        req.user = decoded;
        next(); // Lanjutkan ke middleware/route selanjutnya
    } catch (error) {
        // Jika token tidak valid (misal: kadaluarsa, rusak, secret salah)
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.authorize = (roles = []) => {
    // Pastikan roles adalah array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Jika user tidak terautentikasi (req.user tidak ada dari middleware protect)
        // atau jika peran user tidak termasuk dalam peran yang diizinkan
        if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
        }
        next(); // User memiliki izin, lanjutkan
    };
};