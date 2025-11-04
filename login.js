// login.js
async function login() {
  this.error = '';

  try {
    const res = await fetch('https://matrix.org/_matrix/client/r0/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'm.login.password',
        user: this.username,
        password: this.password
      })
    });

    const data = await res.json();

    if (data && data.access_token) {
      this.accessToken = data.access_token;
      this.userId = data.user_id || '';

      // Отримати кімнати та перше завантаження повідомлень
      await this.fetchRoomsWithNames();
      this.fetchMessages();

      // Періодичне оновлення
      setInterval(() => {
        this.fetchRoomsWithNames();
        this.fetchMessages();
      }, 5000);
    } else {
      const msg = (data && (data.error || data.errcode)) || 'Unknown error';
      this.error = localizeMatrixError(msg);
    }
  } catch (e) {
    console.error(e);
    this.error = 'Помилка під час логіну: ' + (e.message || e);
  }
}

// Локалізація типових помилок Matrix
function localizeMatrixError(msg) {
  const m = ('' + msg).toUpperCase();
  if (m.includes('FORBIDDEN') || m.includes('UNAUTHORIZED') || m.includes('M_FORBIDDEN'))
    return 'Невірний логін або пароль.';
  if (m.includes('M_LIMIT_EXCEEDED') || m.includes('RATE LIMIT'))
    return 'Забагато спроб. Зачекайте та повторіть.';
  if (m.includes('M_CAPTCHA_NEEDED') || m.includes('CAPTCHA'))
    return 'Потрібна CAPTCHA. Завершіть в офіційному клієнті.';
  if (m.includes('BAD JSON') || m.includes('M_BAD_JSON'))
    return 'Невірний формат запиту.';
  return 'Login failed: ' + msg;
}
