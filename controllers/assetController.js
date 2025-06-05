const pool = require('../config/db');
const path = require('path');
const fs = require('fs'); // Node.js File System module untuk menghapus file

// GET semua aset (dengan pencarian dan filter)
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

// CREATE aset baru (dengan upload gambar opsional)
exports.createAsset = async (req, res) => {
    // Data aset sekarang ada di req.body (parsed by Multer)
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
        status
    } = req.body;

    let foto_url = null; // Default null, akan diisi jika ada file atau URL dari form

    // Jika ada file gambar yang diunggah oleh Multer
    if (req.file) {
        foto_url = `/uploads/${req.file.filename}`;
    } else if (req.body.foto_url && req.body.foto_url !== '') { // Jika tidak ada file, tapi ada URL yang dikirim dari form (misal dari edit form)
        foto_url = req.body.foto_url; // Ini relevan jika form input type="url" masih dipakai atau ada field hidden
    }


    // Pastikan category_id dan location_id di-parse sebagai integer
    const parsedCategoryId = parseInt(category_id);
    const parsedLocationId = parseInt(location_id);
    const parsedHargaPerolehan = parseFloat(harga_perolehan) || 0;

    try {
        const [result] = await pool.execute(
            'INSERT INTO assets (nomor_inventaris, nama_aset, category_id, description, `condition`, location_id, penanggung_jawab, tanggal_perolehan, harga_perolehan, foto_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nomor_inventaris, nama_aset, parsedCategoryId, description, condition, parsedLocationId, penanggung_jawab, tanggal_perolehan, parsedHargaPerolehan, foto_url, status]
        );
        res.status(201).json({ message: 'Aset created successfully', assetId: result.insertId });
    } catch (error) {
        console.error('Error creating asset:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nomor inventaris sudah ada. Harap gunakan nomor lain.' });
        }
        res.status(500).json({ message: 'Error creating asset', error: error.message });
    }
};

// UPDATE aset (dengan update gambar opsional dan penghapusan gambar lama)
exports.updateAsset = async (req, res) => {
    const { id } = req.params;
    // Data aset sekarang ada di req.body (parsed by Multer)
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
        status
    } = req.body;

    let new_foto_url = null; // Default null, akan diisi dari req.file atau req.body

    // 1. Dapatkan foto_url lama dari database sebelum update
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [oldAssetRows] = await connection.execute('SELECT foto_url FROM assets WHERE id = ?', [id]);
        const oldAsset = oldAssetRows[0];
        const oldImageUrl = oldAsset ? oldAsset.foto_url : null;

        // Tentukan foto_url baru
        if (req.file) { // Jika ada file baru diupload
            new_foto_url = `/uploads/${req.file.filename}`;
        } else if (req.body.foto_url_existing && req.body.foto_url_existing !== 'null' && req.body.foto_url_existing !== 'undefined') {
            // Jika tidak ada file baru, tapi ada URL yang sudah ada dari hidden field frontend
            new_foto_url = req.body.foto_url_existing;
        } else { // Jika file tidak di-upload dan URL lama juga dikosongkan/tidak ada dari form
            new_foto_url = null; // Set ke null di database jika dikosongkan
        }

        // Pastikan category_id dan location_id di-parse sebagai integer
        const parsedCategoryId = parseInt(category_id);
        const parsedLocationId = parseInt(location_id);
        const parsedHargaPerolehan = parseFloat(harga_perolehan) || 0;


        let sql = 'UPDATE assets SET nomor_inventaris = ?, nama_aset = ?, category_id = ?, description = ?, `condition` = ?, location_id = ?, penanggung_jawab = ?, tanggal_perolehan = ?, harga_perolehan = ?, foto_url = ?, status = ?';
        const params = [
            nomor_inventaris, nama_aset, parsedCategoryId, description, condition, parsedLocationId,
            penanggung_jawab, tanggal_perolehan, parsedHargaPerolehan, new_foto_url, status
        ];

        // Tambahkan password_hash jika password disertakan (ini untuk userController, bukan asset)
        // Pastikan ini dihapus jika ini ada di sini dari kesalahan copy-paste
        /*
        if (req.body.password) { // password datang dari form, bukan user object
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            sql += ', password_hash = ?';
            params.push(hashedPassword);
        }
        */

        sql += ' WHERE id = ?';
        params.push(id);

        const [result] = await connection.execute(sql, params);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Asset not found' });
        }

        // 2. Logika Penghapusan Gambar Lama
        // Hapus gambar lama HANYA JIKA gambar baru diupload ATAU URL lama dikosongkan,
        // DAN gambar lama adalah file lokal kita (dimulai dengan /uploads/)
        if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
            // Hapus jika ada file baru di-upload (dan berbeda)
            if (req.file && oldImageUrl !== new_foto_url) {
                const oldImagePath = path.join(__dirname, '../public', oldImageUrl);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Failed to delete old image file on update (new file):', oldImagePath, err);
                    else console.log('Successfully deleted old image on update (new file):', oldImagePath);
                });
            }
            // Hapus jika user mengosongkan field foto_url dan sebelumnya ada gambar lokal
            else if (!new_foto_url && oldImageUrl !== null) { // new_foto_url akan jadi null jika dikosongkan dari form
                 const oldImagePath = path.join(__dirname, '../public', oldImageUrl);
                 fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Failed to delete old image file on empty URL:', oldImagePath, err);
                    else console.log('Successfully deleted old image on empty URL:', oldImagePath);
                });
            }
        }


        await connection.commit();
        res.json({ message: 'Asset updated successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating asset:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nomor inventaris sudah ada. Harap gunakan nomor lain.' });
        }
        res.status(500).json({ message: 'Error updating asset', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE aset (dengan penghapusan file gambar terkait)
exports.deleteAsset = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Ambil foto_url aset sebelum menghapus record
        const [assetRows] = await connection.execute('SELECT foto_url FROM assets WHERE id = ?', [id]);
        const assetToDelete = assetRows[0];
        const imageUrlToDelete = assetToDelete ? assetToDelete.foto_url : null;

        // 2. Hapus record aset dari database
        const [result] = await connection.execute('DELETE FROM assets WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Asset not found' });
        }

        // 3. Hapus file gambar dari server jika ada dan merupakan file lokal
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '../public', imageUrlToDelete);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete asset image file on delete:', imagePath, err);
                    // Jangan rollback, karena penghapusan database sudah sukses
                } else {
                    console.log('Successfully deleted asset image:', imagePath);
                }
            });
        }

        await connection.commit();
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};