document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah form submit secara default

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.style.color = 'green';
            messageElement.textContent = data.message;
            localStorage.setItem('token', data.token); // Simpan token JWT
            // Redirect ke halaman dashboard atau aset
            window.location.href = '/dashboard.html'; // Anda perlu membuat file ini
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        console.error('Error during login:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = 'Server error. Please try again later.';
    }
});