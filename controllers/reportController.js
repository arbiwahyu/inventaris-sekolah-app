const pool = require('../config/db');

// Laporan 1: Ringkasan Inventaris Umum (Total Aset, Aset Tersedia, Aset Dipinjam)
exports.getInventorySummary = async (req, res) => {
    try {
        const [totalAssetsResult] = await pool.execute('SELECT COUNT(id) AS total_assets FROM assets');
        const [availableAssetsResult] = await pool.execute('SELECT COUNT(id) AS available_assets FROM assets WHERE status = "Tersedia"');
        const [borrowedAssetsResult] = await pool.execute('SELECT COUNT(id) AS borrowed_assets FROM assets WHERE status = "Dipinjam"');

        const summary = {
            total_assets: totalAssetsResult[0].total_assets,
            available_assets: availableAssetsResult[0].available_assets,
            borrowed_assets: borrowedAssetsResult[0].borrowed_assets
        };
        res.json(summary);
    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        res.status(500).json({ message: 'Error fetching inventory summary', error: error.message });
    }
};

// Laporan 2: Jumlah Aset per Kategori
exports.getAssetsByCategory = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                c.nama_kategori,
                COUNT(a.id) AS total_assets
            FROM
                categories c
            LEFT JOIN
                assets a ON c.id = a.category_id
            GROUP BY
                c.nama_kategori
            ORDER BY
                c.nama_kategori ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching assets by category:', error);
        res.status(500).json({ message: 'Error fetching assets by category', error: error.message });
    }
};

// Laporan 3: Jumlah Aset per Lokasi
exports.getAssetsByLocation = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                l.nama_lokasi,
                COUNT(a.id) AS total_assets
            FROM
                locations l
            LEFT JOIN
                assets a ON l.id = a.location_id
            GROUP BY
                l.nama_lokasi
            ORDER BY
                l.nama_lokasi ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching assets by location:', error);
        res.status(500).json({ message: 'Error fetching assets by location', error: error.message });
    }
};

// Laporan 4: Ringkasan Aset yang Sedang Dipinjam (Nama Peminjam, Aset, Tanggal Pinjam, Estimasi Kembali)
exports.getBorrowedAssetsSummary = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                br.borrower_name,
                a.nomor_inventaris,
                a.nama_aset,
                br.borrow_date,
                br.return_date_expected,
                br.borrow_condition
            FROM
                borrow_records br
            JOIN
                assets a ON br.asset_id = a.id
            WHERE
                br.return_date_actual IS NULL -- Hanya yang sedang dipinjam
            ORDER BY
                br.borrow_date ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching borrowed assets summary:', error);
        res.status(500).json({ message: 'Error fetching borrowed assets summary', error: error.message });
    }
};