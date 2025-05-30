// public/js/authCheck.js
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Jika tidak ada token, redirect ke halaman login
        window.location.href = '/'; // Atau '/index.html'
    }
    // Jika ada token, Anda mungkin ingin memvalidasinya dengan API backend
    // untuk memastikan token masih valid dan belum kedaluwarsa.
    // Untuk saat ini, kita anggap token ada = authenticated.
});