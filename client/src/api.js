import { useEffect, useState } from 'react';

const TOKEN_KEY = 'st_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = t => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body } = {}) {
  const t = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && t && !path.startsWith('/auth/login')) { setToken(null); window.dispatchEvent(new Event('st-logout')); }
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

// Build a query string, skipping empty / "All" values.
export const qs = obj => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null && v !== 'All') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

// GET hook — keeps the previous data on screen while a filter change reloads.
export function useFetch(path) {
  const [s, set] = useState({ data: null, error: '', loading: !!path });
  useEffect(() => {
    let off = false;
    if (!path) { set({ data: null, error: '', loading: false }); return; }
    set(p => ({ ...p, loading: true, error: '' }));
    api(path).then(d => !off && set({ data: d, error: '', loading: false }))
      .catch(e => !off && set(p => ({ data: p.data, error: e.message, loading: false })));
    return () => { off = true; };
  }, [path]);
  return s;
}
