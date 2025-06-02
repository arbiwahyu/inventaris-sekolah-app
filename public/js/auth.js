// public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Memastikan form login ada di halaman ini
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Mencegah form submit secara default

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageElement = document.getElementById('message');

            // Bersihkan pesan sebelumnya dan atur warna default error
            messageElement.textContent = '';
            messageElement.style.color = 'red';

            try {
                console.log('--- [AUTH FLOW] Starting login attempt ---');
                console.log('Username:', username);

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                console.log('[AUTH FLOW] Response status:', response.status);

                const data = await response.json();
                console.log('[AUTH FLOW] Response data:', data);

                if (response.ok) {
                    messageElement.style.color = 'green';
                    messageElement.textContent = data.message || 'Login berhasil!';

                    console.log('[AUTH FLOW] Login successful.');
                    console.log('[AUTH FLOW] Received token:', data.token); // LOG: Lihat token yang diterima

                    if (data.token) {
                        localStorage.setItem('token', data.token); // Simpan token JWT
                        console.log('[AUTH FLOW] Token stored in Local Storage. Redirecting...'); // LOG: Konfirmasi penyimpanan
                        window.location.href = '/dashboard.html';
                    } else {
                        // Jika login sukses tapi token tidak ada
                        console.error('[AUTH FLOW] Login successful, but no token received in response. Cannot proceed.'); // LOG ERROR
                        messageElement.style.color = 'red';
                        messageElement.textContent = 'Login berhasil, tetapi token tidak ditemukan. Silakan coba lagi.';
                    }

                } else {
                    // Jika respons status bukan OK (misal 400, 401, 403)
                    console.warn('[AUTH FLOW] Login failed (status not OK).');
                    messageElement.style.color = 'red';
                    messageElement.textContent = data.message || 'Login gagal. Periksa kembali username dan password Anda.';
                }
            } catch (error) {
                // Menangani error jaringan atau parsing JSON
                console.error('[AUTH FLOW] Error during login process:', error); // LOG ERROR: Error detail
                messageElement.style.color = 'red';
                messageElement.textContent = 'Terjadi kesalahan server. Mohon coba lagi nanti.';

                // Tambahkan log detail untuk melihat error jika ada masalah parsing JSON
                if (error instanceof SyntaxError && error.message.includes('JSON')) {
                    console.error('[AUTH FLOW] Possible non-JSON response received. Check network tab for response body.');
                }
            }
        });
    } else {
        console.warn('Login form not found. Ensure element with id="loginForm" exists.');
    }
});