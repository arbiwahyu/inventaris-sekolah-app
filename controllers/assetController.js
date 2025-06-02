const pool = require('../config/db'); // Pastikan path ini benar ke file koneksi database Anda

// GET semua aset
exports.getAllAssets = async (req, res) => {
    const { search, category_id, location_id, status } = req.query; // Ambil parameter dari query string
    let sql = `
        SELECT
            a.*,
            c.nama_kategori AS category_name,
            l.nama_lokasi AS location_name
        FROM
            assets a
        LEFT JOIN
            categories c ON a.category_id = c.id
        LEFT JOIN
            locations l ON a.location_id = l.id
        WHERE 1=1 -- Kondisi TRUE awal untuk memudahkan penambahan klausa AND
    `;
    const params = [];

    // Tambahkan kondisi pencarian
    if (search) {
        sql += ` AND (a.nomor_inventaris LIKE ? OR a.nama_aset LIKE ? OR a.penanggung_jawab LIKE ? OR a.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Tambahkan kondisi filter kategori
    if (category_id) {
        sql += ` AND a.category_id = ?`;
        params.push(category_id);
    }

    // Tambahkan kondisi filter lokasi
    if (location_id) {
        sql += ` AND a.location_id = ?`;
        params.push(location_id);
    }

    // Tambahkan kondisi filter status (jika ada)
    if (status) {
        sql += ` AND a.status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY a.nama_aset ASC`; // Urutkan hasil

    try {
        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching assets with search/filter:', error);
        res.status(500).json({ message: 'Error fetching assets', error: error.message });
    }
};

// GET satu aset berdasarkan ID
exports.getAssetById = async (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter URL
    try {
        const [rows] = await pool.execute('SELECT * FROM assets WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(rows[0]); // Mengembalikan objek aset pertama yang ditemukan
    } catch (error) {
        console.error('Error fetching asset by ID:', error);
        res.status(500).json({ message: 'Error fetching asset', error: error.message });
    }
};

// CREATE aset baru
exports.createAsset = async (req, res) => {
    // Mengambil data dari body request
    const {
        nomor_inventaris,
        nama_aset,
        category_id,
        description,
        condition,
        location_id,
        penanggung_jawab,
        tanggal_perolehan,
        harga_perolehan,
        foto_url,
        status
    } = req.body;

    try {
        const [result] = await pool.execute(
            'INSERT INTO assets (nomor_inventaris, nama_aset, category_id, description, `condition`, location_id, penanggung_jawab, tanggal_perolehan, harga_perolehan, foto_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nomor_inventaris, nama_aset, category_id, description, condition, location_id, penanggung_jawab, tanggal_perolehan, harga_perolehan, foto_url, status]
        );
        res.status(201).json({ message: 'Asset created successfully', assetId: result.insertId });
    } catch (error) {
        console.error('Error creating asset:', error);
        // Tangani error jika nomor_inventaris duplikat
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nomor inventaris sudah ada. Harap gunakan nomor lain.' });
        }
        res.status(500).json({ message: 'Error creating asset', error: error.message });
    }
};

// UPDATE aset
exports.updateAsset = async (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter URL
    // Mengambil data yang akan diupdate dari body request
    const {
        nomor_inventaris,
        nama_aset,
        category_id,
        description,
        condition,
        location_id,
        penanggung_jawab,
        tanggal_perolehan,
        harga_perolehan,
        foto_url,
        status
    } = req.body;

    try {
        const [result] = await pool.execute(
            'UPDATE assets SET nomor_inventaris = ?, nama_aset = ?, category_id = ?, description = ?, `condition` = ?, location_id = ?, penanggung_jawab = ?, tanggal_perolehan = ?, harga_perolehan = ?, foto_url = ?, status = ? WHERE id = ?',
            [nomor_inventaris, nama_aset, category_id, description, condition, location_id, penanggung_jawab, tanggal_perolehan, harga_perolehan, foto_url, status, id]
        );
        if (result.affectedRows === 0) {
            // Jika tidak ada baris yang terpengaruh, aset tidak ditemukan
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json({ message: 'Asset updated successfully' });
    } catch (error) {
        console.error('Error updating asset:', error);
        // Tangani error jika nomor_inventaris duplikat saat update
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nomor inventaris sudah ada. Harap gunakan nomor lain.' });
        }
        res.status(500).json({ message: 'Error updating asset', error: error.message });
    }
};

// DELETE aset
exports.deleteAsset = async (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter URL
    try {
        const [result] = await pool.execute('DELETE FROM assets WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            // Jika tidak ada baris yang terpengaruh, aset tidak ditemukan
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    }
};