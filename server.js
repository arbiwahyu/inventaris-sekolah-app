require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based API for async/await
const app = express();
const port = process.env.PORT || 3000; // Use port 3000 by default

// --- START: Tambahkan import routes baru di sini ---
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const userRoutes = require('./routes/userRoutes');       // Uncomment jika sudah membuat file ini
const locationRoutes = require('./routes/locationRoutes'); // Uncomment jika sudah membuat file ini
const categoryRoutes = require('./routes/categoryRoutes'); // Uncomment jika sudah membuat file ini
const borrowRoutes = require('./routes/borrowRoutes'); // Uncomment jika sudah membuat file ini
// --- END: Tambahkan import routes baru di sini ---


// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));



// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database!');
        connection.release(); // Release the connection
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
        // process.exit(1); // Ini bisa dinonaktifkan agar aplikasi tetap berjalan meski database error setelah startup awal
    });

// --- START: Tambahkan API Routes di sini ---
// Anda bisa menonaktifkan atau menghapus route GET /api/assets yang lama ini
// karena kita akan mengelolanya di assetRoutes.js
/*
app.get('/api/assets', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM assets');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Error fetching assets' });
    }
});
*/

// Daftarkan API Routes baru
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);       // Uncomment jika sudah membuat file ini
app.use('/api/locations', locationRoutes); // Uncomment jika sudah membuat file ini
app.use('/api/categories', categoryRoutes); // Uncomment jika sudah membuat file ini
app.use('/api/borrow', borrowRoutes); // Uncomment jika sudah membuat file ini
// --- END: Tambahkan API Routes di sini ---

// Error handling middleware (optional, tapi disarankan untuk catch error)
// Letakkan ini setelah semua route Anda
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.
    next();
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Ganti ini agar sesuai dengan akses Nginx
    console.log(`Access it via Nginx reverse proxy at https://inventaris.arbeelab.com`);
});