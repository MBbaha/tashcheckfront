import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${BASE_URL}/api/userKvitansiya`,
  timeout: 15000,
});

export function getErrorMessage(err, fallback = "Server bilan bog'lanishda xatolik yuz berdi") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'Server javob bermadi. Qayta urinib ko‘ring.';
  return fallback;
}
