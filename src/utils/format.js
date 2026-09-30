const ONES = ['', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"];
const TENS = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"];
const SCALES = ['', 'ming', 'million', 'milliard', 'trillion'];

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const chunkToWords = (n) => {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  return [h ? `${ONES[h]} yuz` : '', t ? TENS[t] : '', o ? ONES[o] : '']
    .filter(Boolean)
    .join(' ');
};

/** 12500000 -> "o'n ikki million besh yuz ming so'm" */
export function numberToWordsUzbek(value, currency = "so'm") {
  const num = Math.floor(Number(String(value ?? '').replace(/\s/g, '')) || 0);
  if (!num) return '';
  const parts = [];
  let rest = num;
  let i = 0;
  while (rest > 0 && i < SCALES.length) {
    const chunk = rest % 1000;
    if (chunk) parts.unshift([chunkToWords(chunk), SCALES[i]].filter(Boolean).join(' '));
    rest = Math.floor(rest / 1000);
    i++;
  }
  return `${parts.join(' ')} ${currency}`;
}

/** 12000000 -> "12 000 000" */
export function formatMoney(value) {
  const n = Math.round(Number(value) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Input uchun: faqat raqam qoldiradi va 3 talab ajratadi */
export function formatNumberInput(value) {
  return String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const stripSpaces = (v) => String(v ?? '').replace(/\s/g, '');

/** "901234567" -> "90 123 45 67" */
export function formatPhone(value) {
  const d = String(value).replace(/\D/g, '').slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

/**
 * dd.mm.yyyy
 * utc: true — faqat sana saqlanadigan maydonlar uchun (uchish sanasi),
 * vaqt zonasi tufayli bir kun surilib ketmasligi uchun.
 */
export function formatDate(value, { utc = false } = {}) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = utc ? d.getUTCDate() : d.getDate();
  const month = (utc ? d.getUTCMonth() : d.getMonth()) + 1;
  const year = utc ? d.getUTCFullYear() : d.getFullYear();
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

/** "29-Sentabr 2026-yil" */
export function formatLongDate(value = new Date()) {
  const d = new Date(value);
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}-yil`;
}

/** 7 -> "0007" */
export const padNumber = (n) => (n || n === 0 ? String(n).padStart(4, '0') : '————');
