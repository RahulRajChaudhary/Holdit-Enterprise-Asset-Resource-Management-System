import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem('holdit_user');
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  function setSession({ token, user }) {
    localStorage.setItem('holdit_token', token);
    localStorage.setItem('holdit_user', JSON.stringify(user));
    setUser(user);
  }

  function clearSession() {
    localStorage.removeItem('holdit_token');
    localStorage.removeItem('holdit_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
