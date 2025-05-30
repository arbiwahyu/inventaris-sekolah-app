const pool = require('../config/db');

exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, nama_kategori FROM categories ORDER BY nama_kategori');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};