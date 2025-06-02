const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    console.log(`[LOGIN FLOW] --- Starting login attempt for username: ${username}`); // LOG 1

    try {
        console.log(`[LOGIN FLOW] Step 1: Querying user for username: ${username}`); // LOG 2
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            console.log(`[LOGIN FLOW] Step 2: User ${username} not found.`); // LOG 3
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`[LOGIN FLOW] Step 3: User ${username} found. Comparing password.`); // LOG 4
        // Pastikan password_hash di database bukan null atau undefined
        if (!user.password_hash) {
            console.error(`[LOGIN FLOW] CRITICAL ERROR: password_hash is missing for user ${username}`); // LOG KRITIS
            return res.status(500).json({ message: 'Server error: Missing password hash.' });
        }
        // console.log(`[LOGIN FLOW] User password_hash: ${user.password_hash}`); // LOG DEBUG: HATI-HATI JANGAN DIPAKAI DI PROD

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log(`[LOGIN FLOW] Step 4: Password mismatch for user: ${username}`); // LOG 5
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`[LOGIN FLOW] Step 5: Password matched for user: ${username}. Generating token.`); // LOG 6

        // Pastikan JWT_SECRET terdefinisi
        if (!process.env.JWT_SECRET) {
            console.error(`[LOGIN FLOW] CRITICAL ERROR: JWT_SECRET is not defined in .env`); // LOG KRITIS
            // Jika JWT_SECRET tidak ada, ini akan menyebabkan masalah JWT
            return res.status(500).json({ message: 'Server error: JWT secret missing. Please contact support.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // Gunakan process.env.JWT_SECRET tanpa fallback di sini
            { expiresIn: '1h' }
        );

        console.log(`[LOGIN FLOW] Step 6: Login successful for user: ${username}. Sending response.`); // LOG 7
        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, role: user.role } });

    } catch (error) {
        // Ini akan mencetak error ke pm2 logs inventaris-app
        console.error('[LOGIN FLOW] UNCAUGHT ERROR during login process:', error); // LOG 8 (Penting!)
        // Tambahkan ini untuk melihat lebih detail jika error object tidak lengkap
        console.error(error.stack); // LOG 9
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};