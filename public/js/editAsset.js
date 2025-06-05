    // public/js/editAsset.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const messageElement = document.getElementById('message');
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id'); // Mengambil ID dari parameter URL

    // Elemen untuk upload gambar
    const currentFotoPreview = document.getElementById('current_foto_preview');
    const currentFotoUrlText = document.getElementById('current_foto_url_text');
    const currentFotoUrlSpan = document.getElementById('current_foto_url_span');
    const fotoFileEditInput = document.getElementById('foto_file_edit'); // Input type="file"
    const fotoPreviewEdit = document.getElementById('foto_preview_edit'); // Gambar preview untuk file baru

    if (!token || !assetId) {
        alert('Aset tidak ditemukan atau sesi berakhir.');
        window.location.href = '/dashboard.html';
        return;
    }

    // Fungsi untuk memuat kategori dan lokasi ke dropdown (mirip dengan addAsset.js)
    async function loadCategoriesAndLocations(selectedCategoryId = null, selectedLocationId = null) {
        try {
            // Memuat Kategori
            const categoriesResponse = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!categoriesResponse.ok) throw new Error('Gagal memuat kategori.');
            const categories = await categoriesResponse.json();
            const categorySelect = document.getElementById('category_id'); // ID input HTML
            categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nama_kategori;
                categorySelect.appendChild(option);
                if (selectedCategoryId !== null && cat.id === selectedCategoryId) {
                    option.selected = true;
                }
            });

            // Memuat Lokasi
            const locationsResponse = await fetch('/api/locations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!locationsResponse.ok) throw new Error('Gagal memuat lokasi.');
            const locations = await locationsResponse.json();
            const locationSelect = document.getElementById('location_id'); // ID input HTML
            locationSelect.innerHTML = '<option value="">-- Pilih Lokasi --</option>';
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.id;
                option.textContent = loc.nama_lokasi;
                locationSelect.appendChild(option);
                if (selectedLocationId !== null && loc.id === selectedLocationId) {
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
            document.getElementById('assetId').value = asset.id; // Hidden field untuk ID aset
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
            document.getElementById('status').value = asset.status || '';

            // === LOGIKA UNTUK FOTO YANG SUDAH ADA ===
            if (asset.foto_url) {
                // Tampilkan gambar lama
                currentFotoPreview.src = asset.foto_url;
                currentFotoPreview.style.display = 'block';
                currentFotoUrlSpan.textContent = asset.foto_url;
                currentFotoUrlText.style.display = 'block';
            } else {
                // Sembunyikan jika tidak ada gambar lama
                currentFotoPreview.style.display = 'none';
                currentFotoUrlText.style.display = 'none';
            }
            // === AKHIR LOGIKA FOTO ===

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

    // === LOGIKA UNTUK PRATINJAU GAMBAR BARU SAAT EDIT ===
    fotoFileEditInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoPreviewEdit.src = e.target.result;
                fotoPreviewEdit.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            fotoPreviewEdit.style.display = 'none';
        }
    });
    // === AKHIR LOGIKA PRATINJAU GAMBAR BARU ===


    // Event listener untuk submit form (UPDATE aset)
    document.getElementById('assetForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Mengambil data form menggunakan FormData
        const formData = new FormData();
        formData.append('nomor_inventaris', document.getElementById('nomor_inventaris').value);
        formData.append('nama_aset', document.getElementById('nama_aset').value);
        formData.append('description', document.getElementById('description') ? document.getElementById('description').value : '');
        formData.append('category_id', document.getElementById('category_id').value);
        formData.append('location_id', document.getElementById('location_id').value);
        formData.append('condition', document.getElementById('condition').value);
        formData.append('penanggung_jawab', document.getElementById('penanggung_jawab').value);
        formData.append('tanggal_perolehan', document.getElementById('tanggal_perolehan').value);
        formData.append('harga_perolehan', parseFloat(document.getElementById('harga_perolehan').value) || 0);
        formData.append('status', document.getElementById('status').value);

        // Jika ada file gambar baru yang dipilih
        if (fotoFileEditInput.files && fotoFileEditInput.files[0]) {
            formData.append('assetImage', fotoFileEditInput.files[0]); // 'assetImage' harus sesuai dengan nama field di Multer
        } else {
            // Jika tidak ada file baru di-upload, kirimkan URL foto lama yang ada saat ini
            // Ini akan digunakan di backend untuk menentukan apakah perlu hapus gambar lama
            formData.append('foto_url_existing', currentFotoUrlSpan.textContent || ''); // Menggunakan ID yang ada di HTML
        }

        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'PUT', // Metode HTTP PUT untuk update
                // Penting: JANGAN SET 'Content-Type': 'application/json' untuk FormData
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // Kirim FormData langsung
            });

            const data = await response.json();

            if (response.ok) {
                messageElement.style.color = 'green';
                messageElement.textContent = 'Aset berhasil diperbarui!';
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