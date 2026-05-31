// API client for the Road to Debt Freedom backend.
//
// Set the base URL to your running FastAPI server. When testing on a real
// iPhone via Expo Go, "localhost" points at the phone, not your computer — use
// your machine's LAN IP (e.g. http://192.168.1.20:8000) or a tunnel URL.

import { Platform } from 'react-native';

// 10.0.2.2 is the Android emulator's alias for the host machine.
// Real iOS devices (Expo Go) need this machine's LAN IP — "localhost" would
// resolve to the phone itself.
const LAN_HOST = '192.168.1.107';
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : LAN_HOST;

export const API_BASE = `http://${DEV_HOST}:8000`;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listPlans: () => request('/plans'),

  createPlan: (plan = { name: 'My Plan' }) =>
    request('/plans', { method: 'POST', body: JSON.stringify(plan) }),

  getPlan: (id) => request(`/plans/${id}`),

  updatePlan: (id, patch) =>
    request(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deletePlan: (id) => request(`/plans/${id}`, { method: 'DELETE' }),

  getProjection: (id) => request(`/plans/${id}/projection`),

  setProgress: (id, month, payload) =>
    request(`/plans/${id}/progress/${month}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
