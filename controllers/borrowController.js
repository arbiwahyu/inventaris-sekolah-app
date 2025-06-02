const pool = require('../config/db');

// Fungsi bantu untuk memperbarui status aset
const updateAssetStatus = async (assetId, status, connection) => {
    await connection.execute('UPDATE assets SET status = ? WHERE id = ?', [status, assetId]);
};

// CREATE: Mencatat peminjaman baru
exports.createBorrowRecord = async (req, res) => {
    const { asset_id, borrower_name, return_date_expected, borrow_condition, notes } = req.body;
    const userId = req.user.id; // Mendapatkan ID pengguna yang login dari token JWT

    if (!asset_id || !borrower_name) {
        return res.status(400).json({ message: 'Asset ID and Borrower Name are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Mulai transaksi

        // 1. Catat peminjaman
        const [result] = await connection.execute(
            'INSERT INTO borrow_records (asset_id, borrower_name, return_date_expected, borrow_condition, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [asset_id, borrower_name, return_date_expected, borrow_condition, notes, userId]
        );

        // 2. Perbarui status aset menjadi 'Dipinjam'
        await updateAssetStatus(asset_id, 'Dipinjam', connection);

        await connection.commit(); // Komit transaksi
        res.status(201).json({ message: 'Asset borrowed successfully', borrowRecordId: result.insertId });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback jika ada error
        console.error('Error creating borrow record:', error);
        res.status(500).json({ message: 'Error recording borrow', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// UPDATE: Mencatat pengembalian aset
exports.returnAsset = async (req, res) => {
    const { borrowRecordId } = req.params;
    const { return_condition, notes } = req.body;
    const userId = req.user.id;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Mulai transaksi

        // 1. Perbarui catatan peminjaman dengan tanggal pengembalian aktual dan kondisi
        const [borrowRecordResult] = await connection.execute(
            'UPDATE borrow_records SET return_date_actual = NOW(), return_condition = ?, notes = ?, user_id = ? WHERE id = ? AND return_date_actual IS NULL',
            [return_condition, notes, userId, borrowRecordId]
        );

        if (borrowRecordResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Borrow record not found or already returned.' });
        }

        // 2. Dapatkan asset_id dari catatan peminjaman
        const [borrowData] = await connection.execute('SELECT asset_id FROM borrow_records WHERE id = ?', [borrowRecordId]);
        const assetId = borrowData[0].asset_id;

        // 3. Perbarui status aset menjadi 'Tersedia'
        await updateAssetStatus(assetId, 'Tersedia', connection);

        await connection.commit(); // Komit transaksi
        res.json({ message: 'Asset returned successfully' });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback jika ada error
        console.error('Error returning asset:', error);
        res.status(500).json({ message: 'Error recording return', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// READ: Mendapatkan semua riwayat peminjaman
exports.getAllBorrowRecords = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                br.*,
                a.nomor_inventaris,
                a.nama_aset,
                u.username AS staff_username,
                br.borrower_name AS peminjam_nama -- Alias untuk membedakan
            FROM
                borrow_records br
            JOIN
                assets a ON br.asset_id = a.id
            LEFT JOIN
                users u ON br.user_id = u.id
            ORDER BY br.borrow_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all borrow records:', error);
        res.status(500).json({ message: 'Error fetching borrow history', error: error.message });
    }
};

// READ: Mendapatkan riwayat peminjaman untuk aset tertentu
exports.getAssetBorrowHistory = async (req, res) => {
    const { assetId } = req.params;
    try {
        const [rows] = await pool.execute(`
            SELECT
                br.*,
                u.username AS staff_username,
                br.borrower_name AS peminjam_nama
            FROM
                borrow_records br
            LEFT JOIN
                users u ON br.user_id = u.id
            WHERE br.asset_id = ?
            ORDER BY br.borrow_date DESC
        `, [assetId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching asset borrow history:', error);
        res.status(500).json({ message: 'Error fetching asset history', error: error.message });
    }
};