document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    handleAuth('login', { email, password });
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    handleAuth('register', { name, email, password });
});

async function handleAuth(type, body) {
    const errorMsg = document.getElementById('error-message');
    const btn = document.getElementById(type + 'Btn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');

    errorMsg.style.display = 'none';
    btnText.style.display = 'none';
    loader.style.display = 'block';
    btn.disabled = true;

    try {
        const url = type === 'login' ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('ss_token', data.token);
            localStorage.setItem('ss_user', JSON.stringify(data.user));
            window.location.href = 'index.php';
        } else {
            errorMsg.textContent = data.message || 'Authentication failed.';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.textContent = 'Connection error.';
        errorMsg.style.display = 'block';
    } finally {
        btnText.style.display = 'block';
        loader.style.display = 'none';
        btn.disabled = false;
    }
}
