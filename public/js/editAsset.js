// public/js/editAsset.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const messageElement = document.getElementById('message');
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id'); // Mengambil ID dari URL

    if (!token || !assetId) {
        alert('Aset tidak ditemukan atau sesi berakhir.');
        window.location.href = '/dashboard.html';
        return;
    }

    // Fungsi untuk memuat kategori dan lokasi ke dropdown (mirip dengan addAsset.js)
    async function loadCategoriesAndLocations(selectedCategoryId = null, selectedLocationId = null) {
        try {
            // Memuat Kategori
            const categoriesResponse = await fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!categoriesResponse.ok) throw new Error('Gagal memuat kategori.');
            const categories = await categoriesResponse.json();
            const categorySelect = document.getElementById('category_id');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nama_kategori;
                categorySelect.appendChild(option);
                if (selectedCategoryId && cat.id === selectedCategoryId) {
                    option.selected = true;
                }
            });

            // Memuat Lokasi
            const locationsResponse = await fetch('/api/locations', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!locationsResponse.ok) throw new Error('Gagal memuat lokasi.');
            const locations = await locationsResponse.json();
            const locationSelect = document.getElementById('location_id');
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.id;
                option.textContent = loc.nama_lokasi;
                locationSelect.appendChild(option);
                if (selectedLocationId && loc.id === selectedLocationId) {
                    option.selected = true;
                }
            });

        } catch (error) {
            console.error('Error loading categories/locations:', error);
            messageElement.style.color = 'red';
            messageElement.textContent = 'Gagal memuat daftar kategori atau lokasi: ' + error.message;
        }
    }

    // Fungsi untuk memuat data aset yang akan diedit
    async function loadAssetData() {
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Aset tidak ditemukan.');
            const asset = await response.json();

            // Mengisi form dengan data aset
            document.getElementById('nomor_inventaris').value = asset.nomor_inventaris || '';
            document.getElementById('nama_aset').value = asset.nama_aset || '';
            if (document.getElementById('description')) document.getElementById('description').value = asset.description || '';
            document.getElementById('condition').value = asset.condition || '';
            document.getElementById('penanggung_jawab').value = asset.penanggung_jawab || '';

            // Tanggal Perolehan (format YYYY-MM-DD untuk input type="date")
            if (asset.tanggal_perolehan) {
                const date = new Date(asset.tanggal_perolehan);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById('tanggal_perolehan').value = formattedDate;
            } else {
                document.getElementById('tanggal_perolehan').value = '';
            }

            document.getElementById('harga_perolehan').value = asset.harga_perolehan || 0;
            document.getElementById('foto_url').value = asset.foto_url || '';
            document.getElementById('status').value = asset.status || '';

            // Memuat dropdown dengan data aset terpilih
            await loadCategoriesAndLocations(asset.category_id, asset.location_id);

        } catch (error) {
            console.error('Error loading asset data:', error);
            alert('Gagal memuat data aset: ' + error.message);
            window.location.href = '/dashboard.html';
        }
    }

    // Panggil fungsi untuk memuat data aset saat halaman dimuat
    await loadAssetData();

    // Event listener untuk submit form (UPDATE aset)
    document.getElementById('assetForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const assetData = {
            nomor_inventaris: document.getElementById('nomor_inventaris').value,
            nama_aset: document.getElementById('nama_aset').value,
            category_id: parseInt(document.getElementById('category_id').value),
            description: document.getElementById('description') ? document.getElementById('description').value : null,
            condition: document.getElementById('condition').value,
            location_id: parseInt(document.getElementById('location_id').value),
            penanggung_jawab: document.getElementById('penanggung_jawab').value,
            tanggal_perolehan: document.getElementById('tanggal_perolehan').value,
            harga_perolehan: parseFloat(document.getElementById('harga_perolehan').value) || 0,
            foto_url: document.getElementById('foto_url').value,
            status: document.getElementById('status').value
        };

        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'PUT', // Metode HTTP PUT untuk update
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assetData)
            });

            const data = await response.json();

            if (response.ok) {
                messageElement.style.color = 'green';
                messageElement.textContent = 'Aset berhasil diperbarui!';
                // Redirect kembali ke dashboard setelah sukses
                setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
            } else {
                messageElement.style.color = 'red';
                messageElement.textContent = data.message || 'Gagal memperbarui aset.';
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            messageElement.style.color = 'red';
            messageElement.textContent = 'Server error. Gagal memperbarui aset: ' + error.message;
        }
    });
});