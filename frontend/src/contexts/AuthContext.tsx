import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  getStoredToken,
  storeToken,
  AUTH_EVENTS,
  type ApiUser,
} from '../services/api';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export type SessionEndReason = 'idle' | 'expired' | null;

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  sessionEndReason: SessionEndReason;
  clearSessionEndReason: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  sessionEndReason: null,
  clearSessionEndReason: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => storeToken(null))
      .finally(() => setLoading(false));
  }, []);

  const endSession = useCallback((reason: SessionEndReason) => {
    storeToken(null);
    setUser((prev) => {
      if (prev && reason) setSessionEndReason(reason);
      return null;
    });
  }, []);

  const logout = useCallback(() => {
    setSessionEndReason(null);
    endSession(null);
  }, [endSession]);

  useEffect(() => {
    const handler = () => endSession('expired');
    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handler);
    return () => window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handler);
  }, [endSession]);

  useIdleTimeout(user !== null, IDLE_TIMEOUT_MS, () => endSession('idle'));

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password });
    storeToken(token);
    setSessionEndReason(null);
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await api.register({ name, email, password });
    storeToken(token);
    setSessionEndReason(null);
    setUser(user);
  }, []);

  const clearSessionEndReason = useCallback(() => setSessionEndReason(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sessionEndReason,
      clearSessionEndReason,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
