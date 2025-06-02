const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Diperlukan untuk hashing password

// List peran yang valid
const VALID_ROLES = ['admin', 'staff', 'guru', 'siswa'];

// GET semua user
exports.getAllUsers = async (req, res) => {
    try {
        // JANGAN mengambil password_hash! Ini informasi sensitif.
        const [rows] = await pool.execute('SELECT id, username, role, nama_lengkap, email, created_at FROM users ORDER BY username ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// GET satu user berdasarkan ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute('SELECT id, username, role, nama_lengkap, email, created_at FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// CREATE user baru
exports.createUser = async (req, res) => {
    const { username, password, role, nama_lengkap, email } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required.' });
    }
    // Validasi peran
    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role specified. Valid roles are: ${VALID_ROLES.join(', ')}` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role, nama_lengkap, email) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role, nama_lengkap, email]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// UPDATE user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role, nama_lengkap, email } = req.body;

    if (!username || !role) { // Username dan role tetap wajib
        return res.status(400).json({ message: 'Username and role are required for update.' });
    }
    // Validasi peran
    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role specified. Valid roles are: ${VALID_ROLES.join(', ')}` });
    }

    let sql = 'UPDATE users SET username = ?, role = ?, nama_lengkap = ?, email = ?';
    const params = [username, role, nama_lengkap, email];

    if (password) { // Jika password disertakan, hash dan update
        const hashedPassword = await bcrypt.hash(password, 10);
        sql += ', password_hash = ?';
        params.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    try {
        const [result] = await pool.execute(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// DELETE user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Tidak boleh menghapus user yang sedang login!
        if (req.user.id === parseInt(id)) {
            return res.status(403).json({ message: 'You cannot delete your own account.' });
        }
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};