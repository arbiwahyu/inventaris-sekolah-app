// public/js/authCheck.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log('--- [AUTH CHECK] Running token check ---');

    const token = localStorage.getItem('token');
    console.log('[AUTH CHECK] Token from Local Storage:', token);

    if (!token) {
        console.warn('[AUTH CHECK] No token found in Local Storage. Redirecting to login page.');
        // Jika tidak ada token, redirect ke halaman login
        window.location.href = '/'; // Atau '/index.html'
        return; // Hentikan eksekusi lebih lanjut
    }

    // --- Opsional: Validasi Token Sisi Frontend (Lebih Canggih) ---
    // Di lingkungan produksi, sangat disarankan untuk memvalidasi token JWT
    // dengan API backend untuk memastikan token masih valid dan belum kedaluwarsa.
    // Kode di bawah ini adalah contoh bagaimana Anda bisa melakukannya.
    // Jika Anda ingin mengaktifkannya, pastikan Anda juga memiliki endpoint backend
    // seperti /api/auth/verify-token yang memvalidasi JWT.

    // KOMENTARI SELURUH BLOK try...catch INI SEMENTARA:
    /*
    try {
        console.log('[AUTH CHECK] Token found. Attempting to verify token with backend...');
        const response = await fetch('/api/auth/verify-token', { // Anda perlu membuat endpoint ini di backend
            method: 'POST', // Atau GET, tergantung implementasi Anda
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[AUTH CHECK] Token successfully verified by backend. User is authenticated.');
            // Jika Anda ingin mendapatkan info user terbaru, Anda bisa ambil dari respons
            // const userData = await response.json();
            // console.log('Authenticated user data:', userData);
            // Lanjutkan ke dashboard
        } else {
            // Jika backend menolak token (kadaluarsa, tidak valid, dll.)
            const errorData = await response.json();
            console.error('[AUTH CHECK] Token verification failed by backend:', errorData.message);
            alert('Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.');
            localStorage.removeItem('token'); // Hapus token yang invalid
            window.location.href = '/'; // Redirect ke login
        }
    } catch (error) {
        // Menangani error jaringan atau backend tidak merespons
        console.error('[AUTH CHECK] Error during token verification:', error);
        alert('Terjadi masalah saat memverifikasi sesi Anda. Silakan login kembali.');
        localStorage.removeItem('token'); // Hapus token
        window.location.href = '/'; // Redirect ke login
    }
    */
    // --- Akhir KOMENTAR BLOK try...catch ---

    // Jika Anda tidak menggunakan validasi token sisi frontend di atas (karena dikomentari),
    // maka hanya keberadaan token di Local Storage sudah dianggap cukup untuk lanjut ke dashboard.
    console.log('[AUTH CHECK] Token found. User is authenticated (basic check).');
});