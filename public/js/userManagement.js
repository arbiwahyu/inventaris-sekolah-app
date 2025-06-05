// public/js/userManagement.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    // Elemen Modal
    const userModal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const userIdField = document.getElementById('userId');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const namaLengkapField = document.getElementById('nama_lengkap');
    const emailField = document.getElementById('email');
    const roleField = document.getElementById('role');
    const userMessage = document.getElementById('userMessage');
    const userForm = document.getElementById('userForm');

    if (!token) {
        window.location.href = '/'; // Redirect ke login jika tidak ada token
        return;
    }

    // Fungsi untuk memuat daftar pengguna
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sesi Anda berakhir atau tidak memiliki izin. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.href = '/';
                }
                throw new Error('Gagal memuat data pengguna.');
            }
            const users = await response.json();
            const usersTableBody = document.querySelector('#usersTable tbody');
            usersTableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

            if (users.length === 0) {
                const row = usersTableBody.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 5; // Sesuaikan dengan jumlah kolom
                cell.textContent = 'Tidak ada pengguna yang ditemukan.';
                cell.style.textAlign = 'center';
                return;
            }

            users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user.username;
                row.insertCell().textContent = user.nama_lengkap || 'N/A';
                row.insertCell().textContent = user.email || 'N/A';
                row.insertCell().textContent = user.role;

                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.innerHTML = '<i class="fas fa-edit"></i> Edit'; // Icon
                editButton.classList.add('btn', 'btn-warning', 'btn-sm');
                editButton.onclick = () => openUserModalForEdit(user.id, token);

                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus'; // Icon
                deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ml-1');
                deleteButton.onclick = () => deleteUser(user.id, token);

                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });

        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Terjadi kesalahan saat memuat daftar pengguna: ' + error.message);
        }
    }

    // Fungsi untuk membuka modal untuk menambah user baru
    document.getElementById('addUserButton').addEventListener('click', () => {
        modalTitle.textContent = 'Tambah Pengguna';
        userForm.reset();
        userIdField.value = ''; // Pastikan ID kosong untuk operasi tambah
        passwordField.setAttribute('required', 'required'); // Password wajib untuk user baru
        userMessage.textContent = '';
        userModal.style.display = 'block';
    });

    // Fungsi untuk membuka modal untuk mengedit user
    async function openUserModalForEdit(userId, token) {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Gagal memuat data pengguna.');
            const user = await response.json();

            modalTitle.textContent = 'Edit Pengguna';
            userForm.reset();
            userIdField.value = user.id;
            usernameField.value = user.username;
            namaLengkapField.value = user.nama_lengkap || '';
            emailField.value = user.email || '';
            roleField.value = user.role;
            passwordField.removeAttribute('required'); // Password tidak wajib saat edit
            passwordField.value = ''; // Kosongkan password saat edit
            userMessage.textContent = '';
            userModal.style.display = 'block';

        } catch (error) {
            console.error('Error loading user data for edit:', error);
            alert('Gagal memuat data pengguna untuk diedit: ' + error.message);
        }
    }

    // Event listener untuk submit form tambah/edit pengguna
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userId = userIdField.value;
        const userData = {
            username: usernameField.value,
            password: passwordField.value, // Akan kosong jika tidak diubah
            nama_lengkap: namaLengkapField.value,
            email: emailField.value,
            role: roleField.value
        };

        let url = '/api/users';
        let method = 'POST';
        if (userId) { // Jika userId ada, berarti update
            url = `/api/users/${userId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await response.json();

            if (response.ok) {
                userMessage.style.color = 'green';
                userMessage.textContent = data.message;
                setTimeout(() => {
                    userModal.style.display = 'none';
                    fetchUsers(); // Muat ulang daftar pengguna
                }, 1000);
            } else {
                userMessage.style.color = 'red';
                userMessage.textContent = data.message || 'Gagal menyimpan pengguna.';
            }
        } catch (error) {
            console.error('Error saving user:', error);
            userMessage.style.color = 'red';
            userMessage.textContent = 'Server error. Gagal menyimpan pengguna: ' + error.message;
        }
    });

    // Fungsi untuk menghapus pengguna
    async function deleteUser(userId, token) {
        if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    alert('Pengguna berhasil dihapus!');
                    fetchUsers(); // Muat ulang daftar pengguna setelah dihapus
                } else {
                    const errorData = await response.json();
                    alert(`Gagal menghapus pengguna: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Terjadi kesalahan saat menghapus pengguna.');
            }
        }
    }

    // Menutup modal jika klik pada tombol close atau di luar area konten
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            userModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == userModal) {
            userModal.style.display = 'none';
        }
    });

    // Muat daftar pengguna saat halaman dimuat
    await fetchUsers();
});