<aside class="sidebar">
    <div class="sidebar-header">
        <div class="logo-circle">S</div>
        <span class="logo-text">Scheduler</span>
    </div>
    
    <div class="create-btn-container">
        <button id="createTaskBtn" class="btn-create">
            <span class="plus">+</span> Create
        </button>
    </div>

    <nav class="sidebar-nav">
        <!-- Calendar will be injected here via JS if needed, or static for now -->
        <div id="mini-calendar" class="mini-cal"></div>

        <div class="nav-section">
            <div class="section-title">Categories</div>
            <ul class="category-list">
                <li><span class="dot work"></span> Work</li>
                <li><span class="dot personal"></span> Personal</li>
                <li><span class="dot urgent"></span> Urgent</li>
                <li><span class="dot other"></span> Other</li>
            </ul>
        </div>
    </nav>

    <div class="sidebar-footer">
        <div id="user-display" class="user-info">
            <span id="username">User</span>
        </div>
        <button id="logoutBtn" class="btn-outline">Sign out</button>
    </div>
</aside>
