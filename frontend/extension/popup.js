document.addEventListener('DOMContentLoaded', () => {
  const authView = document.getElementById('auth-view');
  const agentView = document.getElementById('agent-view');
  const openAppBtn = document.getElementById('open-app-btn');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesContainer = document.getElementById('messages');
  
  // Check for token in storage
  chrome.storage.local.get(['token'], (result) => {
    if (result.token) {
      showAgentView();
    } else {
      showAuthView();
    }
  });

  // Listen for changes in local storage
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.token) {
      if (changes.token.newValue) {
        showAgentView();
      } else {
        showAuthView();
      }
    }
  });

  openAppBtn.addEventListener('click', () => {
    // Open the TaskFlow web app
    chrome.tabs.create({ url: 'http://localhost:5173/' });
  });

  // Enter key support
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage(text, 'user');
    chatInput.value = '';
    
    sendBtn.disabled = true;
    chatInput.disabled = true;
    
    // Add loading message
    const loadingId = 'loading-' + Date.now();
    addMessage('Thinking...', 'system', loadingId);

    chrome.storage.local.get(['token'], async (result) => {
      const token = result.token;
      
      try {
        const response = await fetch('http://localhost:5000/api/agent/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        });

        removeMessage(loadingId);

        if (response.ok) {
          const data = await response.json();
          addMessage(data.reply, 'agent');
        } else if (response.status === 401 || response.status === 400) {
          addMessage('Unauthorized or expired session.', 'system');
          // Clear invalid token
          chrome.storage.local.remove('token', () => showAuthView());
        } else {
          const errData = await response.json().catch(() => ({}));
          addMessage(errData.error || 'Failed to get response.', 'system');
        }
      } catch (err) {
        removeMessage(loadingId);
        addMessage('Network error. Is the server running?', 'system');
      }

      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    });
  }

  function addMessage(text, sender, id = null) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    if (id) div.id = id;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function showAuthView() {
    authView.style.display = 'block';
    agentView.style.display = 'none';
  }

  function showAgentView() {
    authView.style.display = 'none';
    agentView.style.display = 'block';
    chatInput.focus();
  }
});
