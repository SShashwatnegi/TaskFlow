<?php
session_start();
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
    <title>Register - Smart Scheduler</title>
    <link rel="stylesheet" href="assets/css/auth.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <div class="logo-circle">S</div>
                <h1>Create Account</h1>
                <p>Join Smart Scheduler today</p>
            </div>
            <form id="registerForm" class="auth-form">
                <div class="input-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" placeholder="John Doe" required>
                </div>
                <div class="input-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="name@example.com" required>
                </div>
                <div class="input-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="••••••••" required>
                </div>
                <div id="error-message" class="error-text" style="display:none;"></div>
                <button type="submit" id="registerBtn" class="btn-primary">
                    <span class="btn-text">Sign Up</span>
                    <div class="loader" style="display:none;"></div>
                </button>
                <div class="auth-footer">
                    <span>Already have an account?</span>
                    <a href="login.php">Sign In</a>
                </div>
            </form>
        </div>
    </div>
    <script src="assets/js/auth.js"></script>
</body>
</html>
