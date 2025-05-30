const pool = require('../config/db');

exports.getAllLocations = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, nama_lokasi FROM locations ORDER BY nama_lokasi');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations', error: error.message });
    }
};