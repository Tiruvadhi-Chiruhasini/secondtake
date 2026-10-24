import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (getToken()) api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
    const out = () => setUser(null);
    window.addEventListener('st-logout', out);
    return () => window.removeEventListener('st-logout', out);
  }, []);

  const finish = r => { setToken(r.token); setUser(r.user); return r.user; };
  const value = {
    user, ready,
    login: (b) => api('/auth/login', { method: 'POST', body: b }).then(finish),
    signup: (b) => api('/auth/signup', { method: 'POST', body: b }).then(finish),
    logout: () => { setToken(null); setUser(null); },
    updateProfile: (b) => api('/auth/profile', { method: 'PUT', body: b }).then(setUser),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
