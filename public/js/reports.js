// public/js/reports.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/'; // Redirect ke login jika tidak ada token
        return;
    }

    

    // Pastikan user adalah admin untuk mengakses laporan
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const user = JSON.parse(window.atob(base64));

        document.getElementById('loggedInUserTop').textContent = user.username;

        if (user.role !== 'admin' && user.role !== 'staff') {
            alert('Anda tidak memiliki izin untuk mengakses halaman laporan.');
            window.location.href = '/dashboard.html'; // Redirect jika bukan admin
            return;
        }

        // Muat semua laporan
        await fetchInventorySummary(token);
        await fetchAssetsByCategory(token);
        await fetchAssetsByLocation(token);
        await fetchBorrowedAssetsSummary(token);

    } catch (error) {
        console.error("Error initializing reports page:", error);
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    // Elemen Logout (untuk SB Admin 2 logout modal)
    const logoutButtonSB = document.getElementById('logoutButtonSB');
    if (logoutButtonSB) {
        logoutButtonSB.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }
});

// Fungsi untuk mengambil dan menampilkan Ringkasan Inventaris Umum
async function fetchInventorySummary(token) {
    try {
        const response = await fetch('/api/reports/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat ringkasan inventaris.');
        const summary = await response.json();

        document.getElementById('totalAssets').textContent = summary.total_assets;
        document.getElementById('availableAssets').textContent = summary.available_assets;
        document.getElementById('borrowedAssets').textContent = summary.borrowed_assets;

    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        alert('Terjadi kesalahan saat memuat ringkasan inventaris: ' + error.message);
    }
}

// Fungsi untuk mengambil dan menampilkan Aset per Kategori
async function fetchAssetsByCategory(token) {
    try {
        const response = await fetch('/api/reports/assets-by-category', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat aset per kategori.');
        const data = await response.json();

        const tableBody = document.querySelector('#assetsByCategoryTable tbody');
        tableBody.innerHTML = '';
        if (data.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 2;
            cell.textContent = 'Tidak ada data kategori.';
            cell.style.textAlign = 'center';
            return;
        }
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = item.nama_kategori;
            row.insertCell().textContent = item.total_assets;
        });

    } catch (error) {
        console.error('Error fetching assets by category:', error);
        alert('Terjadi kesalahan saat memuat laporan aset per kategori: ' + error.message);
    }
}

// Fungsi untuk mengambil dan menampilkan Aset per Lokasi
async function fetchAssetsByLocation(token) {
    try {
        const response = await fetch('/api/reports/assets-by-location', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat aset per lokasi.');
        const data = await response.json();

        const tableBody = document.querySelector('#assetsByLocationTable tbody');
        tableBody.innerHTML = '';
        if (data.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 2;
            cell.textContent = 'Tidak ada data lokasi.';
            cell.style.textAlign = 'center';
            return;
        }
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = item.nama_lokasi;
            row.insertCell().textContent = item.total_assets;
        });

    } catch (error) {
        console.error('Error fetching assets by location:', error);
        alert('Terjadi kesalahan saat memuat laporan aset per lokasi: ' + error.message);
    }
}

// Fungsi untuk mengambil dan menampilkan Ringkasan Aset yang Sedang Dipinjam
async function fetchBorrowedAssetsSummary(token) {
    try {
        const response = await fetch('/api/reports/borrowed-assets-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat ringkasan aset dipinjam.');
        const data = await response.json();

        const tableBody = document.querySelector('#borrowedAssetsTable tbody');
        tableBody.innerHTML = '';
        if (data.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // Sesuaikan dengan jumlah kolom
            cell.textContent = 'Tidak ada aset yang sedang dipinjam.';
            cell.style.textAlign = 'center';
            return;
        }
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = item.borrower_name || '';
            row.insertCell().textContent = item.nomor_inventaris || '';
            row.insertCell().textContent = item.nama_aset || '';
            row.insertCell().textContent = item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : '';
            row.insertCell().textContent = item.return_date_expected ? new Date(item.return_date_expected).toLocaleDateString() : 'N/A';
            row.insertCell().textContent = item.borrow_condition || '';
        });

    } catch (error) {
        console.error('Error fetching borrowed assets summary:', error);
        alert('Terjadi kesalahan saat memuat laporan aset dipinjam: ' + error.message);
    }
}