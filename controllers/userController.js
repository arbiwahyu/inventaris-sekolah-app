const pool = require('../config/db');

exports.getAllUsers = async (req, res) => {
    try {
        // Jangan mengambil password_hash!
        const [rows] = await pool.execute('SELECT id, username, role, nama_lengkap, email FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// exports.createUser = async (req, res) => { /* ... */ };
// exports.updateUser = async (req, res) => { /* ... */ };
// exports.deleteUser = async (req, res) => { /* ... */ };