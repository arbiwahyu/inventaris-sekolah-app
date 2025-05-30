// public/js/addAsset.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const messageElement = document.getElementById('message');

    if (!token) {
        window.location.href = '/'; // Redirect ke login jika tidak ada token
        return;
    }

    // Fungsi untuk memuat kategori dan lokasi ke dropdown
    async function loadCategoriesAndLocations() {
        try {
            // Memuat Kategori
            const categoriesResponse = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!categoriesResponse.ok) throw new Error('Gagal memuat kategori.');
            const categories = await categoriesResponse.json();
            const categorySelect = document.getElementById('category_id');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nama_kategori;
                categorySelect.appendChild(option);
            });

            // Memuat Lokasi
            const locationsResponse = await fetch('/api/locations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!locationsResponse.ok) throw new Error('Gagal memuat lokasi.');
            const locations = await locationsResponse.json();
            const locationSelect = document.getElementById('location_id');
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.id;
                option.textContent = loc.nama_lokasi;
                locationSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading categories/locations:', error);
            messageElement.style.color = 'red';
            messageElement.textContent = 'Gagal memuat daftar kategori atau lokasi: ' + error.message;
        }
    }

    // Panggil fungsi untuk memuat kategori dan lokasi saat halaman dimuat
    await loadCategoriesAndLocations();

    // Event listener untuk submit form
    document.getElementById('assetForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const assetData = {
            nomor_inventaris: document.getElementById('nomor_inventaris').value,
            nama_aset: document.getElementById('nama_aset').value,
            category_id: parseInt(document.getElementById('category_id').value), // Pastikan ini integer
            description: document.getElementById('description') ? document.getElementById('description').value : null,
            condition: document.getElementById('condition').value,
            location_id: parseInt(document.getElementById('location_id').value), // Pastikan ini integer
            penanggung_jawab: document.getElementById('penanggung_jawab').value,
            tanggal_perolehan: document.getElementById('tanggal_perolehan').value,
            harga_perolehan: parseFloat(document.getElementById('harga_perolehan').value) || 0,
            foto_url: document.getElementById('foto_url').value,
            status: document.getElementById('status').value
        };

        try {
            const response = await fetch('/api/assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assetData)
            });

            const data = await response.json();

            if (response.ok) {
                messageElement.style.color = 'green';
                messageElement.textContent = 'Aset berhasil ditambahkan!';
                document.getElementById('assetForm').reset(); // Kosongkan form
                // Atau redirect ke dashboard setelah beberapa detik:
                // setTimeout(() => { window.location.href = '/dashboard.html'; }, 2000);
            } else {
                messageElement.style.color = 'red';
                messageElement.textContent = data.message || 'Gagal menambahkan aset.';
            }
        } catch (error) {
            console.error('Error adding asset:', error);
            messageElement.style.color = 'red';
            messageElement.textContent = 'Server error. Gagal menambahkan aset: ' + error.message;
        }
    });
});