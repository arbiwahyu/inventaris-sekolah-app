const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Jika menggunakan JWT

// Fungsi untuk mendaftarkan user admin pertama kali (bisa dijalankan via terminal atau endpoint sementara)
exports.registerAdmin = async (req, res) => {
    const { username, password, nama_lengkap, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role, nama_lengkap, email) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, 'admin', nama_lengkap, email]
        );
        res.status(201).json({ message: 'Admin user registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Error registering admin', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Jika menggunakan JWT (JSON Web Token)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecretjwtkey', // Gunakan JWT_SECRET dari .env
            { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, role: user.role } });

        // Jika tidak menggunakan JWT, bisa langsung kirim data user atau session id
        // res.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};