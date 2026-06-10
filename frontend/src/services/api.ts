const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'webflow-token';

// sessionStorage: o token é apagado quando o navegador é fechado,
// forçando login novamente — comportamento pedido para a auth.
const storage: Storage | null = typeof sessionStorage !== 'undefined' ? sessionStorage : null;

export const AUTH_EVENTS = {
  UNAUTHORIZED: 'webflow:auth-unauthorized',
} as const;

function dispatchUnauthorized() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED));
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  try {
    return storage?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (!storage) return;
    if (token) storage.setItem(TOKEN_KEY, token);
    else storage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  // Sliding session: backend devolve novo token nos últimos minutos antes de expirar.
  const renewed = res.headers.get('X-Renewed-Token');
  if (renewed) storeToken(renewed);

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (res.status === 401) {
    storeToken(null);
    dispatchUnauthorized();
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || res.statusText;
    throw new ApiError(res.status, message, data?.details);
  }
  return data as T;
}

export interface ApiFlowSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFlow extends ApiFlowSummary {
  statements: unknown[];
}

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  me: () => request<{ user: ApiUser }>('/api/auth/me'),

  listFlows: () => request<{ flows: ApiFlowSummary[] }>('/api/flows'),
  getFlow: (id: string) => request<{ flow: ApiFlow }>(`/api/flows/${id}`),
  createFlow: (input: { name: string; statements: unknown[] }) =>
    request<{ flow: ApiFlow }>('/api/flows', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateFlow: (id: string, input: { name: string; statements: unknown[] }) =>
    request<{ flow: ApiFlow }>(`/api/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteFlow: (id: string) =>
    request<null>(`/api/flows/${id}`, { method: 'DELETE' }),
};
