export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const normalizeStandard = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

export const formatTime = (seconds) => {
  const s = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export const getPakistanDateTime = () => {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map(({ type, value }) => [type, value]));
  const { day, month, year, hour, minute, second } = parts;
  const ampm = (parts.dayPeriod || '').toUpperCase();
  return `${day}-${month}-${year} ${hour}:${minute}:${second} ${ampm}`;
};


