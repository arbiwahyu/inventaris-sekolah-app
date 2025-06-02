// public/js/dashboard.js

// --- Definisi Fungsi-fungsi Bantu (Ditempatkan di bagian atas file) ---

// Fungsi untuk memuat opsi kategori dan lokasi ke dropdown filter
async function loadFilterOptions(token) {
    try {
        // Memuat Kategori
        const categoriesResponse = await fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!categoriesResponse.ok) throw new Error('Gagal memuat kategori filter.');
        const categories = await categoriesResponse.json();
        const categoryFilterSelect = document.getElementById('categoryFilter');
        // Kosongkan dulu agar tidak duplikat opsi jika fungsi dipanggil lagi
        categoryFilterSelect.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nama_kategori;
            categoryFilterSelect.appendChild(option);
        });

        // Memuat Lokasi
        const locationsResponse = await fetch('/api/locations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!locationsResponse.ok) throw new Error('Gagal memuat lokasi filter.');
        const locations = await locationsResponse.json();
        const locationFilterSelect = document.getElementById('locationFilter');
        // Kosongkan dulu agar tidak duplikat opsi
        locationFilterSelect.innerHTML = '<option value="">Semua Lokasi</option>';
        locations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.id;
            option.textContent = loc.nama_lokasi;
            locationFilterSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading filter options:', error);
        alert('Terjadi kesalahan saat memuat opsi filter: ' + error.message);
    }
}

// Fungsi untuk memuat daftar aset (dengan pencarian dan filter)
async function fetchAssets(token, search = '', category_id = '', location_id = '') {
    try {
        let url = `/api/assets?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category_id) url += `category_id=${encodeURIComponent(category_id)}&`;
        if (location_id) url += `location_id=${encodeURIComponent(location_id)}&`;

        if (url.endsWith('&')) {
            url = url.slice(0, -1); // Hapus '&' terakhir jika ada
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
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
        console.log('Fetched assets:', assets);
        const assetsTableBody = document.querySelector('#assetsTable tbody');
        assetsTableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

        if (assets.length === 0) {
            const row = assetsTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7; // Sesuaikan dengan jumlah kolom di tabel Anda
            cell.textContent = 'Tidak ada aset yang ditemukan.';
            cell.style.textAlign = 'center';
            return;
        }

        assets.forEach(asset => {
            console.log('Processing asset:', asset);
            const row = assetsTableBody.insertRow();

            let cell; // Deklarasikan variabel cell di luar try-catch
            // Pastikan pemanggilan insertCell() dilakukan sekali dan hasilnya disimpan
            try {
                cell = row.insertCell(0); // Tambahkan index 0 untuk kolom pertama
                cell.setAttribute('data-label', 'No. Inventaris');
                cell.textContent = asset.nomor_inventaris || '';
            } catch (e) { console.error('Error on nomor_inventaris:', asset.nomor_inventaris, e); }

            try {
                cell = row.insertCell(1); // Tambahkan index 1 untuk kolom kedua
                cell.setAttribute('data-label', 'Nama Aset');
                cell.textContent = asset.nama_aset || '';
            } catch (e) { console.error('Error on nama_aset:', asset.nama_aset, e); }

            try {
                cell = row.insertCell(2); // Tambahkan index 2
                cell.setAttribute('data-label', 'Kategori');
                cell.textContent = asset.category_name || 'N/A';
            } catch (e) { console.error('Error on category_name:', asset.category_name, e); }

            try {
                cell = row.insertCell(3); // Tambahkan index 3
                cell.setAttribute('data-label', 'Lokasi');
                cell.textContent = asset.location_name || 'N/A';
            } catch (e) { console.error('Error on location_name:', asset.location_name, e); }

            try {
                cell = row.insertCell(4); // Tambahkan index 4
                cell.setAttribute('data-label', 'Kondisi');
                cell.textContent = asset.condition || '';
            } catch (e) { console.error('Error on condition:', asset.condition, e); }

            try {
                cell = row.insertCell(5); // Tambahkan index 5
                cell.setAttribute('data-label', 'Penanggung Jawab');
                cell.textContent = asset.penanggung_jawab || '';
            } catch (e) { console.error('Error on penanggung_jawab:', asset.penanggung_jawab, e); }

            const actionsCell = row.insertCell(6); // Tambahkan index 6
            actionsCell.setAttribute('data-label', 'Aksi');

            // Tombol Edit
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-btn');
            editButton.onclick = () => window.location.href = `/edit-asset.html?id=${asset.id}`;
            actionsCell.appendChild(editButton);

            // Tombol Hapus
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.classList.add('delete-btn');
            deleteButton.onclick = () => deleteAsset(asset.id, token);
            actionsCell.appendChild(deleteButton);

            // Tombol Pinjam/Kembalikan berdasarkan status aset
            if (asset.status === 'Tersedia') {
                const borrowButton = document.createElement('button');
                borrowButton.textContent = 'Pinjam';
                borrowButton.classList.add('borrow-btn');
                borrowButton.onclick = () => openBorrowModal(asset, token);
                actionsCell.appendChild(borrowButton);
            } else if (asset.status === 'Dipinjam') {
                const returnButton = document.createElement('button');
                returnButton.textContent = 'Kembalikan';
                returnButton.classList.add('return-btn');
                returnButton.onclick = () => openReturnModal(asset, token);
                actionsCell.appendChild(returnButton);
            }
        });

    } catch (error) {
        console.error('Error fetching assets:', error);
        alert('Terjadi kesalahan saat memuat daftar aset.');
    }
}

// Fungsi untuk menghapus aset
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

// Fungsi untuk membuka modal peminjaman
async function openBorrowModal(asset, token) {
    const borrowModal = document.getElementById('borrowModal');
    const borrowAssetName = document.getElementById('borrowAssetName');
    const borrowAssetNomorInventaris = document.getElementById('borrowAssetNomorInventaris');
    const borrowAssetId = document.getElementById('borrowAssetId');
    const borrowMessage = document.getElementById('borrowMessage');
    const borrowForm = document.getElementById('borrowForm');

    borrowAssetId.value = asset.id;
    borrowAssetName.textContent = asset.nama_aset;
    borrowAssetNomorInventaris.textContent = asset.nomor_inventaris;
    borrowMessage.textContent = ''; // Bersihkan pesan sebelumnya
    borrowForm.reset(); // Reset form setiap kali modal dibuka

    // Set kondisi default atau dari aset
    document.getElementById('borrowCondition').value = asset.condition || 'Baik';
    document.getElementById('borrowNotes').value = ''; // Kosongkan catatan

    // Set tanggal kembali estimasi (misal 1 minggu dari sekarang)
    const today = new Date();
    today.setDate(today.getDate() + 7); // 7 hari dari sekarang
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('returnDateExpected').value = formattedDate;

    borrowModal.style.display = 'block';
}

// Fungsi untuk membuka modal pengembalian
async function openReturnModal(asset, token) {
    const returnModal = document.getElementById('returnModal');
    const returnAssetName = document.getElementById('returnAssetName');
    const returnAssetNomorInventaris = document.getElementById('returnAssetNomorInventaris');
    const returnBorrowRecordId = document.getElementById('returnBorrowRecordId');
    const returnMessage = document.getElementById('returnMessage');
    const returnForm = document.getElementById('returnForm');

    // Untuk bisa mengembalikan, kita perlu borrowRecordId dari catatan pinjaman aktif
    try {
        const response = await fetch(`/api/borrow/asset/${asset.id}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat riwayat peminjaman.');
        const history = await response.json();
        // Cari catatan pinjaman yang paling baru dan belum dikembalikan
        const activeBorrowRecord = history.find(record => record.return_date_actual === null);

        if (!activeBorrowRecord) {
            alert('Tidak ada catatan peminjaman aktif untuk aset ini.');
            return;
        }

        returnBorrowRecordId.value = activeBorrowRecord.id;
        returnAssetName.textContent = asset.nama_aset;
        returnAssetNomorInventaris.textContent = asset.nomor_inventaris;
        returnMessage.textContent = ''; // Bersihkan pesan sebelumnya
        returnForm.reset(); // Reset form setiap kali modal dibuka
        document.getElementById('returnCondition').value = activeBorrowRecord.borrow_condition || 'Baik'; // Isi kondisi awal
        document.getElementById('returnNotes').value = ''; // Kosongkan catatan

        returnModal.style.display = 'block';

    } catch (error) {
        console.error('Error fetching active borrow record:', error);
        alert('Gagal menemukan catatan peminjaman aktif untuk pengembalian.');
    }
}


// --- Event Listener DOMContentLoaded (Kode utama yang dieksekusi setelah DOM siap) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Jika tidak ada token, redirect ke halaman login
        window.location.href = '/'; // Atau '/index.html'
        return;
    }

    // Elemen Modal (Diinisialisasi di sini karena sudah di dalam DOMContentLoaded)
    // Variabel-variabel ini HARUS dideklarasikan di sini karena elemen-elemennya diakses di sini
    const borrowModal = document.getElementById('borrowModal');
    const returnModal = document.getElementById('returnModal');
    const closeButtons = document.querySelectorAll('.close-button');

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            borrowModal.style.display = 'none';
            returnModal.style.display = 'none';
        });
    });

    // Menutup modal jika klik di luar area konten
    window.addEventListener('click', (event) => {
        if (event.target == borrowModal) {
            borrowModal.style.display = 'none';
        }
        if (event.target == returnModal) {
            returnModal.style.display = 'none';
        }
    });

    // Event listener untuk submit form peminjaman
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) { // Pastikan form ada
        borrowForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const assetId = document.getElementById('borrowAssetId').value;
            const borrowerName = document.getElementById('borrowerName').value;
            const returnDateExpected = document.getElementById('returnDateExpected').value;
            const borrowCondition = document.getElementById('borrowCondition').value;
            const borrowNotes = document.getElementById('borrowNotes').value;
            const borrowMessage = document.getElementById('borrowMessage');

            try {
                const response = await fetch('/api/borrow/borrow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        asset_id: parseInt(assetId),
                        borrower_name: borrowerName,
                        return_date_expected: returnDateExpected,
                        borrow_condition: borrowCondition,
                        notes: borrowNotes
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    borrowMessage.style.color = 'green';
                    borrowMessage.textContent = data.message;
                    setTimeout(() => {
                        borrowModal.style.display = 'none';
                        fetchAssets(token); // Muat ulang daftar aset
                    }, 1000);
                } else {
                    borrowMessage.style.color = 'red';
                    borrowMessage.textContent = data.message || 'Gagal mencatat peminjaman.';
                }
            } catch (error) {
                console.error('Error borrowing asset:', error);
                borrowMessage.style.color = 'red';
                borrowMessage.textContent = 'Server error. Gagal mencatat peminjaman: ' + error.message;
            }
        });
    }


    // Event listener untuk submit form pengembalian
    const returnForm = document.getElementById('returnForm');
    if (returnForm) { // Pastikan form ada
        returnForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const borrowRecordId = document.getElementById('returnBorrowRecordId').value;
            const returnCondition = document.getElementById('returnCondition').value;
            const returnNotes = document.getElementById('returnNotes').value;
            const returnMessage = document.getElementById('returnMessage');

            try {
                const response = await fetch(`/api/borrow/return/${borrowRecordId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        return_condition: returnCondition,
                        notes: returnNotes
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    returnMessage.style.color = 'green';
                    returnMessage.textContent = data.message;
                    setTimeout(() => {
                        returnModal.style.display = 'none';
                        fetchAssets(token); // Muat ulang daftar aset
                    }, 1000);
                } else {
                    returnMessage.style.color = 'red';
                    returnMessage.textContent = data.message || 'Gagal mencatat pengembalian.';
                }
            } catch (error) {
                console.error('Error returning asset:', error);
                returnMessage.style.color = 'red';
                returnMessage.textContent = 'Server error. Gagal mencatat pengembalian: ' + error.message;
            }
        });
    }

    // Inisialisasi awal setelah DOM dimuat dan token diverifikasi
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const user = JSON.parse(window.atob(base64));

        document.getElementById('loggedInUser').textContent = user.username;
        document.getElementById('userRole').textContent = user.role;

        // Tampilkan/sembunyikan tombol Manajemen Pengguna berdasarkan peran
        const userManagementButton = document.getElementById('userManagementButton');
        if (userManagementButton) {
            if (user.role === 'admin') { // Hanya admin yang bisa melihat
                userManagementButton.style.display = 'inline-block';
                userManagementButton.addEventListener('click', () => {
                    window.location.href = '/user-management.html';
                });
            } else {
                userManagementButton.style.display = 'none'; // Sembunyikan untuk peran lain
            }
        }

        // Tampilkan/sembunyikan tombol Tambah Aset berdasarkan peran (misal admin dan staff)
        const addAssetButton = document.getElementById('addAssetButton');
        if (addAssetButton) {
            if (user.role === 'admin' || user.role === 'staff') { // Misalnya admin dan staff bisa tambah aset
                addAssetButton.style.display = 'inline-block';
                addAssetButton.addEventListener('click', () => {
                    window.location.href = '/add-asset.html'; // Ganti dengan URL halaman tambah aset
                });
            } else {
                addAssetButton.style.display = 'none';
            }
        }


        // Muat opsi kategori dan lokasi ke dropdown filter
        await loadFilterOptions(token); // Panggil fungsi yang didefinisikan di atas

        // Muat daftar aset awal (tanpa filter)
        await fetchAssets(token); // Panggil fungsi yang didefinisikan di atas

    } catch (error) {
        console.error("Error decoding token or fetching user data:", error);
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    // Event listeners untuk filter dan pencarian
    document.getElementById('applyFilterButton').addEventListener('click', () => {
        const search = document.getElementById('searchInput').value;
        const category_id = document.getElementById('categoryFilter').value;
        const location_id = document.getElementById('locationFilter').value;
        fetchAssets(token, search, category_id, location_id); // Panggil fetchAssets
    });

    document.getElementById('clearFilterButton').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('locationFilter').value = '';
        fetchAssets(token); // Muat ulang aset tanpa filter
    });

    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });
});