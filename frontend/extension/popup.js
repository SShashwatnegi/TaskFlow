document.addEventListener('DOMContentLoaded', () => {
  const authView = document.getElementById('auth-view');
  const taskView = document.getElementById('task-view');
  const tokenInput = document.getElementById('token-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const taskInput = document.getElementById('task-input');
  const addBtn = document.getElementById('add-btn');
  const statusEl = document.getElementById('status');
  
  // Check for token in storage
  chrome.storage.local.get(['token'], (result) => {
    if (result.token) {
      showTaskView();
    } else {
      showAuthView();
    }
  });

  saveTokenBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (token) {
      chrome.storage.local.set({ token }, () => {
        showTaskView();
        statusEl.textContent = 'Token saved.';
        setTimeout(() => statusEl.textContent = '', 2000);
      });
    }
  });

  addBtn.addEventListener('click', async () => {
    const rawText = taskInput.value.trim();
    if (!rawText) return;

    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';
    
    chrome.storage.local.get(['token'], async (result) => {
      const token = result.token;
      
      try {
        const response = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ rawText })
        });

        if (response.ok) {
          taskInput.value = '';
          statusEl.style.color = '#22c55e';
          statusEl.textContent = 'Task added successfully!';
        } else if (response.status === 401) {
          statusEl.style.color = '#ef4444';
          statusEl.textContent = 'Unauthorized. Invalid token.';
          // Clear invalid token
          chrome.storage.local.remove('token', () => showAuthView());
        } else {
          statusEl.style.color = '#ef4444';
          statusEl.textContent = 'Failed to add task.';
        }
      } catch (err) {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = 'Network error.';
      }

      addBtn.disabled = false;
      addBtn.textContent = 'Add Task';
      
      setTimeout(() => statusEl.textContent = '', 3000);
    });
  });

  function showAuthView() {
    authView.style.display = 'block';
    taskView.style.display = 'none';
  }

  function showTaskView() {
    authView.style.display = 'none';
    taskView.style.display = 'block';
    taskInput.focus();
  }
});
