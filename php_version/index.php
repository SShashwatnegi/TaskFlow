<?php include 'includes/header.php'; ?>
<?php include 'includes/sidebar.php'; ?>

<main class="main-content">
    <header class="top-bar">
        <div class="top-bar-left">
            <button class="menu-toggle">☰</button>
            <span class="app-title">Smart Scheduler</span>
        </div>

        <div class="search-container">
            <div class="search-wrapper">
                <span class="sparkle">✦</span>
                <input type="text" id="nlp-input" placeholder='Quick add: "Meeting tomorrow at 2pm"'>
                <button id="quickAddBtn" class="btn-add">Add</button>
            </div>
        </div>

        <div class="top-bar-right">
            <button class="icon-btn">🔍</button>
            <button class="icon-btn">🔔</button>
            <div class="user-avatar" id="avatar-circle">U</div>
        </div>
    </header>

    <div class="calendar-toolbar">
        <div class="toolbar-left">
            <button id="todayBtn" class="btn-toolbar">Today</button>
            <div class="nav-arrows">
                <button id="prevBtn" class="nav-btn">‹</button>
                <button id="nextBtn" class="nav-btn">›</button>
            </div>
            <h2 id="current-view-title">April 2026</h2>
        </div>
        <div class="toolbar-right">
            <div class="view-switcher">
                <button class="active">Month</button>
                <button>Week</button>
            </div>
        </div>
    </div>

    <div id="calendar-grid" class="calendar-grid">
        <!-- Calendar grid will be rendered here via JS -->
    </div>
</main>

<div id="taskModal" class="modal">
    <!-- Modal content will go here -->
</div>

<script src="assets/js/dashboard.js"></script>
</body>
</html>
