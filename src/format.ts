const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** "2026-11-10" → "10 Nov" */
export const dayMonth = (iso: string) => {
  const d = utc(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

/** "2026-11-10" → "Tue 10 Nov" */
export const weekdayDate = (iso: string) => `${DAYS[utc(iso).getUTCDay()]} ${dayMonth(iso)}`;

/** "2026-11-10" → "Tue" */
export const weekday = (iso: string) => DAYS[utc(iso).getUTCDay()];

/** "2026-09" → "Sep 2026" */
export const monthYear = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

export const addDays = (iso: string, n: number) => {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** "…T10:02" → "10:02" */
export const clock = (iso: string) => iso.slice(11, 16);

export const euro = (n: number) => `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
export const num = (n: number) => n.toLocaleString('en-US');
export const keysLabel = (n: number) => `${n} ${n === 1 ? 'key' : 'keys'}`;
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const kg = (n: number) => n.toFixed(1);
