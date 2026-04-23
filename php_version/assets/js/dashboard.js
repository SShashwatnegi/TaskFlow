let state = {
    user: JSON.parse(localStorage.getItem('ss_user')),
    token: localStorage.getItem('ss_token'),
    tasks: [],
    currentDate: new Date(),
    view: 'month', // 'month' or 'week'
    selectedTask: null,
    miniCalDate: new Date()
};

document.addEventListener('DOMContentLoaded', () => {
    if (!state.token || !state.user) {
        window.location.href = 'login.php';
        return;
    }

    initEventListeners();
    fetchTasks();
    setupPushNotifications(state.token);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('SW Registration Failed', err));
    }
});

async function setupPushNotifications(token) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    // Request permission if not set
    if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
    } else if (Notification.permission === 'denied') {
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/push/vapid-public-key');
        const { publicKey } = await response.json();
        
        const reg = await navigator.serviceWorker.ready;
        let subscription = await reg.pushManager.getSubscription();

        if (subscription) {
            const cachedKey = localStorage.getItem('vapid_public_key');
            if (cachedKey !== publicKey) {
                await subscription.unsubscribe();
                subscription = null;
            }
        }

        if (!subscription) {
            subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            localStorage.setItem('vapid_public_key', publicKey);
        }

        await fetch('http://localhost:5000/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subscription })
        });
    } catch (e) {
        console.error("Push Notification Error", e);
    }
}

function initEventListeners() {
    // Navigation
    document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
    document.getElementById('todayBtn')?.addEventListener('click', () => {
        state.currentDate = new Date();
        render();
    });

    // View Switcher
    const viewButtons = document.querySelectorAll('.view-switcher button');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.textContent.toLowerCase();
            render();
        });
    });

    // NLP Quick Add
    const nlpInput = document.getElementById('nlp-input');
    nlpInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleQuickAdd();
    });
    document.getElementById('quickAddBtn')?.addEventListener('click', handleQuickAdd);

    // Sidebar Create Button
    document.getElementById('createTaskBtn')?.addEventListener('click', () => openTaskModal());

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('ss_token');
        localStorage.removeItem('ss_user');
        window.location.href = 'login.php';
    });
}

function navigate(dir) {
    const d = new Date(state.currentDate);
    if (state.view === "month") {
        d.setMonth(d.getMonth() + dir);
    } else {
        d.setDate(d.getDate() + dir * 7);
    }
    state.currentDate = d;
    render();
}

async function fetchTasks() {
    try {
        const response = await fetch('http://localhost:5000/api/tasks', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'login.php';
            return;
        }
        const data = await response.json();
        state.tasks = data.map(t => ({
            ...t,
            id: t._id,
            date: new Date(t.date),
            endDate: new Date(t.endDate)
        }));
        render();
    } catch (err) {
        console.error("Failed to fetch tasks", err);
    }
}

function render() {
    updateTopBar();
    renderMiniCal();
    if (state.view === 'month') {
        renderMonthView();
    } else {
        renderWeekView();
    }
}

function updateTopBar() {
    const title = document.getElementById('current-view-title');
    const cur = state.currentDate;
    if (state.view === "month") {
        title.textContent = `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`;
    } else {
        const s = new Date(cur);
        s.setDate(s.getDate() - s.getDay());
        const e = new Date(s);
        e.setDate(e.getDate() + 6);
        title.textContent = `${MONTHS[s.getMonth()]} ${s.getDate()} – ${s.getMonth() !== e.getMonth() ? MONTHS[e.getMonth()] + " " : ""}${e.getDate()}, ${e.getFullYear()}`;
    }

    // Avatar
    const avatar = document.getElementById('avatar-circle');
    if (avatar) avatar.textContent = (state.user.name || state.user.email || 'U')[0].toUpperCase();
    document.getElementById('username').textContent = state.user.name || state.user.email;
}

function renderMiniCal() {
    const container = document.getElementById('mini-calendar');
    if (!container) return;
    
    const cur = state.miniCalDate;
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const days = daysInMonth(cur);
    const dow = first.getDay();
    
    let html = `
        <div class="mini-cal-header">
            <button onclick="navMiniCal(-1)">‹</button>
            <span>${MONTHS[cur.getMonth()].substring(0, 3)} ${cur.getFullYear()}</span>
            <button onclick="navMiniCal(1)">›</button>
        </div>
        <div class="mini-cal-grid">
            ${DAYS.map(d => `<div class="day-head">${d[0]}</div>`).join('')}
            ${Array(dow).fill('<div class="empty"></div>').join('')}
            ${Array.from({ length: days }, (_, i) => {
                const date = new Date(cur.getFullYear(), cur.getMonth(), i + 1);
                const isToday = sameDay(date, TODAY);
                const isSelected = sameDay(date, state.currentDate);
                const hasTask = state.tasks.some(t => sameDay(t.date, date) && !t.done);
                return `
                    <div class="day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectMiniDate(${date.getTime()})">
                        ${i + 1}
                        ${hasTask ? '<div class="dot-indicator"></div>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = html;
}

window.navMiniCal = (dir) => {
    state.miniCalDate.setMonth(state.miniCalDate.getMonth() + dir);
    renderMiniCal();
};

window.selectMiniDate = (ts) => {
    state.currentDate = new Date(ts);
    render();
};

function renderMonthView() {
    const grid = document.getElementById('calendar-grid');
    grid.className = 'calendar-grid month-view';
    grid.innerHTML = '';
    
    // Day headers
    DAYS.forEach(d => {
        const h = document.createElement('div');
        h.className = 'grid-header';
        h.textContent = d.toUpperCase();
        grid.appendChild(h);
    });

    const cur = state.currentDate;
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const days = daysInMonth(cur);
    const dow = first.getDay();
    const totalCells = Math.ceil((dow + days) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        const dNum = i - dow + 1;
        const cellDate = (dNum < 1 || dNum > days) ? null : new Date(cur.getFullYear(), cur.getMonth(), dNum);
        
        const cell = document.createElement('div');
        cell.className = 'month-cell' + (!cellDate ? ' empty' : '');
        
        if (cellDate) {
            const isToday = sameDay(cellDate, TODAY);
            const dayTasks = state.tasks.filter(t => sameDay(t.date, cellDate)).sort((a,b) => a.date - b.date);
            
            cell.innerHTML = `
                <div class="cell-num">
                    <span class="${isToday ? 'today-badge' : ''}">${dNum}</span>
                </div>
                <div class="cell-tasks"></div>
            `;
            
            const taskContainer = cell.querySelector('.cell-tasks');
            dayTasks.slice(0, 4).forEach(task => {
                const pill = document.createElement('div');
                pill.className = `task-pill ${task.done ? 'done' : ''}`;
                pill.style.borderLeftColor = CAT[task.category].color;
                pill.style.backgroundColor = task.done ? '#f1f3f4' : CAT[task.category].light;
                pill.style.color = task.done ? '#80868b' : CAT[task.category].color;
                pill.textContent = task.title;
                pill.onclick = (e) => { e.stopPropagation(); openTaskModal(task); };
                taskContainer.appendChild(pill);
            });
            
            if (dayTasks.length > 4) {
                const more = document.createElement('div');
                more.className = 'more-tasks';
                more.textContent = `+${dayTasks.length - 4} more`;
                taskContainer.appendChild(more);
            }

            cell.onclick = () => {
                state.currentDate = cellDate;
                openTaskModal();
            };
        }
        grid.appendChild(cell);
    }
}

function renderWeekView() {
    const grid = document.getElementById('calendar-grid');
    grid.className = 'calendar-grid week-view';
    grid.innerHTML = '';

    const cur = state.currentDate;
    const s = new Date(cur);
    s.setDate(s.getDate() - s.getDay());
    
    // Top Row: Hours + 7 Days
    grid.appendChild(document.createElement('div')); // Corner cell
    for (let i = 0; i < 7; i++) {
        const d = new Date(s);
        d.setDate(d.getDate() + i);
        const isToday = sameDay(d, TODAY);
        const h = document.createElement('div');
        h.className = 'week-header';
        h.innerHTML = `
            <div class="day-name">${DAYS[i].toUpperCase()}</div>
            <div class="day-num ${isToday ? 'today' : ''}">${d.getDate()}</div>
        `;
        grid.appendChild(h);
    }

    // Scroll container for body
    const bodyScroll = document.createElement('div');
    bodyScroll.className = 'week-body-scroll';
    grid.appendChild(bodyScroll);

    const bodyGrid = document.createElement('div');
    bodyGrid.className = 'week-body-grid';
    bodyScroll.appendChild(bodyGrid);

    // Timeline column
    for (let h = 0; h < 24; h++) {
        const timeLab = document.createElement('div');
        timeLab.className = 'time-label';
        timeLab.textContent = h === 0 ? "" : (h < 12 ? `${h} AM` : (h === 12 ? "12 PM" : `${h - 12} PM`));
        bodyGrid.appendChild(timeLab);
        
        // Horizontal grid lines across all days
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.top = `${h * 60}px`;
        bodyGrid.appendChild(line);
    }

    // Task columns
    for (let i = 0; i < 7; i++) {
        const day = new Date(s);
        day.setDate(day.getDate() + i);
        const col = document.createElement('div');
        col.className = 'week-col';
        
        const dayTasks = state.tasks.filter(t => sameDay(t.date, day));
        dayTasks.forEach(task => {
            const top = task.date.getHours() * 60 + task.date.getMinutes();
            const height = Math.max(25, (task.endDate - task.date) / (1000 * 60));
            const card = document.createElement('div');
            card.className = `task-card ${task.done ? 'done' : ''}`;
            card.style.top = `${top}px`;
            card.style.height = `${height}px`;
            card.style.backgroundColor = task.done ? '#f1f3f4' : CAT[task.category].light;
            card.style.borderLeft = `3px solid ${task.done ? '#bdc1c6' : CAT[task.category].color}`;
            card.style.color = task.done ? '#80868b' : CAT[task.category].color;
            card.innerHTML = `
                <div class="title">${task.title}</div>
                ${height > 30 ? `<div class="time">${fmtTime(task.date)}</div>` : ''}
            `;
            card.onclick = () => openTaskModal(task);
            col.appendChild(card);
        });
        
        bodyGrid.appendChild(col);
    }
}

async function handleQuickAdd() {
    const input = document.getElementById('nlp-input');
    const val = input.value.trim();
    if (!val) return;

    const p = parseNLP(val);
    const task = {
        title: p.title,
        date: p.date,
        endDate: p.endDate,
        priority: detectPriority(val),
        category: detectCategory(val),
        notes: "",
        done: false
    };

    input.value = "";
    await apiCall('POST', '', task);
}

function openTaskModal(task = null) {
    state.selectedTask = task;
    const modal = document.getElementById('taskModal');
    const isNew = !task;
    
    // Pre-fill or default
    const t = task || {
        title: "",
        date: new Date(state.currentDate),
        endDate: new Date(state.currentDate.getTime() + 3600000),
        priority: "medium",
        category: "task",
        notes: "",
        done: false
    };
    
    // Set 9 AM if it was just date (for new tasks)
    if (isNew) t.date.setHours(9, 0, 0, 0);

    const fmt = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isNew ? 'New Task' : 'Edit Task'}</h3>
                <button onclick="closeTaskModal()">✕</button>
            </div>
            <div class="modal-body">
                <input type="text" id="m-title" value="${t.title}" placeholder="Task Title" class="main-input">
                
                <div class="input-row">
                    <div class="field">
                        <label>Start</label>
                        <input type="datetime-local" id="m-start" value="${fmt(t.date)}">
                    </div>
                    <div class="field">
                        <label>End</label>
                        <input type="datetime-local" id="m-end" value="${fmt(t.endDate)}">
                    </div>
                </div>

                <div class="input-row">
                    <div class="field">
                        <label>Category</label>
                        <select id="m-category">
                            ${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${t.category === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label>Priority</label>
                        <select id="m-priority">
                            ${Object.entries(PRI).map(([k, v]) => `<option value="${k}" ${t.priority === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="field">
                    <label>Notes</label>
                    <textarea id="m-notes" rows="3">${t.notes || ''}</textarea>
                </div>

                <div class="modal-footer">
                    ${!isNew ? `<button class="btn-delete" onclick="deleteCurrentTask()">Delete</button>` : ''}
                    <label class="check-label"><input type="checkbox" id="m-done" ${t.done ? 'checked' : ''}> Done</label>
                    <button class="btn-cancel" onclick="closeTaskModal()">Cancel</button>
                    <button class="btn-save" onclick="saveCurrentTask()">Save</button>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

window.closeTaskModal = () => {
    document.getElementById('taskModal').style.display = 'none';
};

window.saveCurrentTask = async () => {
    const task = {
        title: document.getElementById('m-title').value,
        date: new Date(document.getElementById('m-start').value),
        endDate: new Date(document.getElementById('m-end.value')),
        category: document.getElementById('m-category').value,
        priority: document.getElementById('m-priority').value,
        notes: document.getElementById('m-notes').value,
        done: document.getElementById('m-done').checked
    };

    if (!task.title) return alert("Title is required");

    const method = state.selectedTask ? 'PUT' : 'POST';
    const url = state.selectedTask ? `/${state.selectedTask.id}` : '';
    
    await apiCall(method, url, task);
    closeTaskModal();
};

window.deleteCurrentTask = async () => {
    if (!state.selectedTask) return;
    if (confirm("Delete this task?")) {
        await apiCall('DELETE', `/${state.selectedTask.id}`);
        closeTaskModal();
    }
};

async function apiCall(method, url, data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            }
        };
        if (data) options.body = JSON.stringify(data);
        
        await fetch(`http://localhost:5000/api/tasks${url}`, options);
        fetchTasks();
    } catch (err) {
        console.error("API Call failed", err);
    }
}
