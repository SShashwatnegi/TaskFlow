self.addEventListener('push', e => {
  const payload = e.data.json();
  console.log('Push Received...', payload);
  self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: 'assets/favicon.svg',
    actions: payload.actions,
    data: payload.data
  });
});

self.addEventListener('notificationclick', e => {
  const notification = e.notification;
  const action = e.action;
  const data = notification.data || {};
  notification.close();

  if (action === 'dismiss' || action === 'snooze') {
    e.waitUntil((async () => {
      try {
        let updateData = {};
        if (action === 'dismiss') {
          updateData = { done: true };
        } else if (action === 'snooze') {
          const ndDate = new Date(Date.now() + 15 * 60000);
          const diff = ndDate.getTime() - data.taskDate;
          const neDate = data.taskEndDate ? new Date(data.taskEndDate + diff) : new Date(ndDate.getTime() + 3600000);
          updateData = { date: ndDate.toISOString(), endDate: neDate.toISOString() };
        }
        
        await fetch(`http://localhost:5000/api/tasks/${data.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
          body: JSON.stringify(updateData)
        });
      } catch (err) {
        console.error('Action failed', err);
      }
    })());
  } else {
    e.waitUntil(clients.matchAll({ type: 'window' }).then(clientsArr => {
      if (data.url) {
        const hadWindow = clientsArr.some(win => win.url.includes(data.url) ? (win.focus(), true) : false);
        if (!hadWindow) clients.openWindow(data.url).then(win => win ? win.focus() : null);
      }
    }));
  }
});
