// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Jika tidak ada token, redirect ke halaman login
        window.location.href = '/'; // Atau '/index.html'
        return;
    }

    // Decode token untuk mendapatkan info user (ini contoh sederhana, di prod harus pakai backend)
    // Jika Anda tidak ingin decode di frontend, Anda bisa fetch info user dari API
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const user = JSON.parse(window.atob(base64));

        document.getElementById('loggedInUser').textContent = user.username;
        document.getElementById('userRole').textContent = user.role;

        // Muat daftar aset
        await fetchAssets(token);

    } catch (error) {
        console.error("Error decoding token or fetching user data:", error);
        localStorage.removeItem('token'); // Hapus token yang invalid
        window.location.href = '/'; // Redirect ke login
    }


    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/'; // Redirect ke halaman login
    });
});

async function fetchAssets(token) {
    try {
        const response = await fetch('/api/assets', {
            headers: {
                'Authorization': `Bearer ${token}` // Kirim token untuk otentikasi API
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Sesi Anda berakhir atau tidak memiliki izin. Silakan login kembali.');
                localStorage.removeItem('token');
                window.location.href = '/';
                return;
            }
            throw new Error('Gagal memuat data aset.');
        }

        const assets = await response.json();
        const assetsTableBody = document.querySelector('#assetsTable tbody');
        assetsTableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

        assets.forEach(asset => {
            const row = assetsTableBody.insertRow();
            row.insertCell().setAttribute('data-label', 'No. Inventaris').textContent = asset.nomor_inventaris || '';
            row.insertCell().setAttribute('data-label', 'Nama Aset').textContent = asset.nama_aset || '';
            row.insertCell().setAttribute('data-label', 'Kategori').textContent = asset.category_name || 'N/A'; // Dari JOIN
            row.insertCell().setAttribute('data-label', 'Lokasi').textContent = asset.location_name || 'N/A'; // Dari JOIN
            row.insertCell().setAttribute('data-label', 'Kondisi').textContent = asset.condition || '';
            row.insertCell().setAttribute('data-label', 'Penanggung Jawab').textContent = asset.penanggung_jawab || '';

            const actionsCell = row.insertCell();
            actionsCell.setAttribute('data-label', 'Aksi');

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-btn'); // Tambahkan kelas untuk styling
            editButton.onclick = () => window.location.href = `/edit-asset.html?id=${asset.id}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.classList.add('delete-btn'); // Tambahkan kelas untuk styling
            deleteButton.onclick = () => deleteAsset(asset.id, token);

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);
        });

    } catch (error) {
        console.error('Error fetching assets:', error);
        alert('Terjadi kesalahan saat memuat daftar aset.');
    }
}

async function deleteAsset(assetId, token) {
    if (confirm('Apakah Anda yakin ingin menghapus aset ini?')) {
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Aset berhasil dihapus!');
                fetchAssets(token); // Muat ulang daftar aset setelah dihapus
            } else {
                const errorData = await response.json();
                alert(`Gagal menghapus aset: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Terjadi kesalahan saat menghapus aset.');
        }
    }
}

// Event listener untuk tombol "Tambah Aset" (pastikan ini di dashboard.js jika tombol ada di dashboard.html)
document.addEventListener('DOMContentLoaded', () => {
    const addAssetButton = document.getElementById('addAssetButton');
    if (addAssetButton) {
        addAssetButton.addEventListener('click', () => {
            window.location.href = '/add-asset.html'; // Redirect ke halaman tambah aset
        });
    }
});