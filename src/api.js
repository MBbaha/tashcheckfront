import axios from 'axios';

// ⬇️ Railway'dagi BACKEND servisingiz manzilini shu yerga yozing (oxirida / bo'lmasin)
const PRODUCTION_API = 'https://tashcheckback-production.up.railway.app';

// Kompyuteringizda (npm run dev) → localhost:5000
// Railway'da → VITE_API_URL berilgan bo'lsa o'sha, bo'lmasa PRODUCTION_API
const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : PRODUCTION_API)
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${BASE_URL}/api/userKvitansiya`,
  timeout: 15000,
});

export function getErrorMessage(err, fallback = "Server bilan bog'lanishda xatolik yuz berdi") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'Server javob bermadi. Qayta urinib ko‘ring.';
  return fallback;
}
