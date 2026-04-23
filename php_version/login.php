<?php
session_start();
// If user is already logged in, redirect to dashboard
if (isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Smart Scheduler</title>
    <link rel="stylesheet" href="assets/css/auth.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <div class="logo-circle">S</div>
                <h1>Smart Scheduler</h1>
                <p>Sign in to continue to your calendar</p>
            </div>
            <form id="loginForm" class="auth-form">
                <div class="input-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="name@example.com" required>
                </div>
                <div class="input-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="••••••••" required>
                </div>
                <div id="error-message" class="error-text" style="display:none;"></div>
                <button type="submit" id="loginBtn" class="btn-primary">
                    <span class="btn-text">Sign In</span>
                    <div class="loader" style="display:none;"></div>
                </button>
                <div class="auth-footer">
                    <span>Don't have an account?</span>
                    <a href="register.php">Create Account</a>
                </div>
            </form>
        </div>
    </div>
    <script src="assets/js/auth.js"></script>
</body>
</html>
