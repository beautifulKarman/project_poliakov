// Надішлати повідомлення у поточну кімнату
async function sendMessage() {
  if (!this.newMessage || !this.newMessage.trim() || !this.roomId) {
    console.warn('No message or roomId');
    return;
  }

  const msg = this.newMessage.trim();
  this.newMessage = '';

  try {
    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/send/m.room.message`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ msgtype: 'm.text', body: msg })
    });

    const data = await res.json();

    if (data && data.event_id) {
      this.messages.push({ id: data.event_id, body: msg, sender: this.userId });

      // автоскрол вниз
      queueMicrotask(() => {
        const box = document.getElementById('messages');
        if (box) box.scrollTop = box.scrollHeight;
      });
    } else {
      console.error('Send failed:', data);
    }
  } catch (e) {
    console.error('Send message error:', e);
  }
}

// Отримати нові повідомлення через /sync
async function fetchMessages() {
  if (!this.accessToken || !this.roomId) return;

  try {
    const base = 'https://matrix.org/_matrix/client/r0/sync';
    const url = this.lastSyncToken
      ? `${base}?since=${encodeURIComponent(this.lastSyncToken)}&timeout=30000`
      : `${base}?timeout=30000`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    const data = await res.json();

    if (data && data.next_batch) {
      this.lastSyncToken = data.next_batch;

      // Повідомлення з приєднаних кімнат
      const joined = data.rooms && data.rooms.join ? data.rooms.join : {};

      if (joined[this.roomId]) {
        const roomData = joined[this.roomId];

        (roomData.timeline?.events || []).forEach(event => {
          if (
            event.type === 'm.room.message' &&
            event.content &&
            typeof event.content.body === 'string' &&
            !this.messages.find(m => m.id === event.event_id)
          ) {
            this.messages.push({
              id: event.event_id,
              body: event.content.body,
              sender: event.sender
            });
          }
        });

        // автоскрол вниз
        queueMicrotask(() => {
          const box = document.getElementById('messages');
          if (box) box.scrollTop = box.scrollHeight;
        });
      }

      // Якщо є інвайти — автоматично приєднуємось (опційно)
      if (data.rooms?.invite) {
        for (const [room] of Object.entries(data.rooms.invite)) {
          if (typeof this.joinRoom === 'function') {
            await this.joinRoom(room);
          }
        }
      }

      // Оновити список кімнат (якщо є така функція)
      if (typeof this.fetchRoomsWithNames === 'function') {
        await this.fetchRoomsWithNames();
      }
    } else {
      console.warn('No next_batch in sync response:', data);
    }
  } catch (e) {
    console.error('Fetch messages error:', e);
  }
}

// Експортуємо у глобальну область, щоб index.html міг підчепити ці методи в chatApp()
window.sendMessage = sendMessage;
window.fetchMessages = fetchMessages;
