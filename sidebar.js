// --------- helpers ---------
function getRoomName(roomId) {
  // Повертаємо "людську" назву з кешу rooms або повний roomId
  return (this.rooms || []).find(r => r.roomId === roomId)?.name || roomId;
}

function switchRoom(roomId) {
  if (roomId) this.roomId = roomId;
  this.messages = [];
  this.lastSyncToken = '';
  if (typeof this.fetchMessages === 'function') {
    this.fetchMessages();
  }
}

async function inviteUserToRoom() {
  if (!this.inviteUser || !this.inviteUser.trim() || !this.roomId) {
    console.warn('No inviteUser or roomId');
    return;
  }

  const userToInvite = this.inviteUser.trim();

  try {
    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/invite`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ user_id: userToInvite })
    });

    const data = await res.json();

    if (data.errcode) {
      console.error('Invite failed:', data);
      alert('Invite failed: ' + (data.error || 'Unknown error'));
    } else {
      alert(`${userToInvite} invited to ${this.roomId}`);
      this.inviteUser = '';
      if (typeof this.fetchRoomsWithNames === 'function') {
        await this.fetchRoomsWithNames();
      }
    }
  } catch (e) {
    console.error('Invite error:', e);
    alert('Invite error: ' + e.message);
  }
}

async function joinRoom() {
  if (!this.joinRoomId || !this.joinRoomId.trim()) return;

  const target = this.joinRoomId.trim();

  try {
    const url = `https://matrix.org/_matrix/client/r0/join/${encodeURIComponent(target)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    const data = await res.json();

    if (data.room_id) {
      this.roomId = target;              // показуємо саме те, що ввів користувач (!xxx:matrix.org)
      this.joinRoomId = '';
      this.messages = [];
      this.lastSyncToken = '';

      if (typeof this.fetchRoomsWithNames === 'function') {
        await this.fetchRoomsWithNames();
      }
      if (typeof this.fetchMessages === 'function') {
        this.fetchMessages();
      }
    } else {
      console.error('Join failed:', data);
      alert('Join failed: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('Join room error:', e);
    alert('Join room error: ' + e.message);
  }
}

// --------- rooms list / creation ---------
async function createRoom() {
  if (!this.accessToken) {
    alert('Спочатку увійдіть у систему.');
    return;
  }
  if (!this.newRoomName || !this.newRoomName.trim()) return;

  const name = this.newRoomName.trim();
  const invite = this.inviteUser ? this.inviteUser.trim() : '';

  try {
    const res = await fetch('https://matrix.org/_matrix/client/r0/createRoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        preset: 'private_chat',
        name,
        invite: invite ? [invite] : []
      })
    });

    const data = await res.json();

    if (data && data.room_id) {
      this.newRoomId = data.room_id;
      this.roomId = data.room_id;
      this.messages = [];
      this.lastSyncToken = '';

      if (typeof this.fetchRoomsWithNames === 'function') {
        await this.fetchRoomsWithNames();
      }
      if (typeof this.fetchMessages === 'function') {
        this.fetchMessages();
      }

      this.inviteUser = '';
      alert(`Room "${name}" created: ${this.newRoomId}`);
      this.newRoomName = '';
    } else {
      console.error('Create room failed:', data);
      alert('Create room failed: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('Create room error:', e);
    alert('Create room error: ' + e.message);
  }
}

async function fetchRoomsWithNames() {
  if (!this.accessToken) return;

  try {
    const res = await fetch('https://matrix.org/_matrix/client/r0/joined_rooms', {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    const data = await res.json();

    if (data && Array.isArray(data.joined_rooms)) {
      const roomPromises = data.joined_rooms.map(async (roomId) => {
        try {
          const nameRes = await fetch(
            `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
            { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
          );
          const nameData = await nameRes.json();
          return {
            roomId,
            name: nameData?.name || getRoomName.call(this, roomId) || roomId
          };
        } catch {
          return { roomId, name: getRoomName.call(this, roomId) || roomId };
        }
      });

      this.rooms = (await Promise.all(roomPromises))
        .sort((a, b) => (a.name || a.roomId).localeCompare(b.name || b.roomId));

      // Якщо ще не вибрана кімната — активуємо першу
      if (this.rooms.length > 0 && !this.roomId) {
        this.roomId = this.rooms[0].roomId;
        if (typeof this.fetchMessages === 'function') {
          this.fetchMessages();
        }
      }
    }
  } catch (e) {
    console.error('Fetch rooms error:', e);
  }
}

// --------- expose for index/sidebar templates ---------
window.getRoomName = getRoomName;
window.switchRoom = switchRoom;
window.inviteUserToRoom = inviteUserToRoom;
window.joinRoom = joinRoom;
window.createRoom = createRoom;
window.fetchRoomsWithNames = fetchRoomsWithNames;

// (опційно) CommonJS для Electron з bundle
try {
  if (typeof module !== 'undefined') {
    module.exports = {
      getRoomName,
      switchRoom,
      inviteUserToRoom,
      joinRoom,
      createRoom,
      fetchRoomsWithNames
    };
  }
} catch (_) { /* noop */ }
