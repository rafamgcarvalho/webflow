import { useState, type FormEvent } from 'react';
import { Workflow } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Não foi possível conectar ao servidor.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <form
        onSubmit={submit}
        style={{
          width: 380,
          maxWidth: '90vw',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 28,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Workflow size={17} color="#fff" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Web<span style={{ color: '#7c3aed' }}>Flow</span>
          </h1>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h2>

        {mode === 'register' && (
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              style={inputStyle}
              autoFocus
            />
          </Field>
        )}

        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            autoFocus={mode === 'login'}
          />
        </Field>

        <Field label="Senha">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : 1}
            style={inputStyle}
          />
        </Field>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: 12,
            padding: '8px 10px',
            borderRadius: 6,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            marginTop: 4,
          }}
        >
          {busy ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-hover)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 6,
  padding: '9px 10px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};
