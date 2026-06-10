import { useState, type FormEvent } from 'react';
import { Workflow, Check, Eye, EyeOff, ArrowRight, Clock } from 'lucide-react';
import { useAuth, type SessionEndReason } from '../contexts/AuthContext';
import { ApiError } from '../services/api';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register, sessionEndReason, clearSessionEndReason } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err instanceof ApiError ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="force-dark" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      <BrandingPanel />
      <FormPanel
        mode={mode}
        onModeChange={(m) => { setMode(m); setError(null); }}
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        error={error}
        busy={busy}
        onSubmit={submit}
        sessionEndReason={sessionEndReason}
        onDismissSessionBanner={clearSessionEndReason}
      />
    </div>
  );
}

function BrandingPanel() {
  return (
    <div
      className="webflow-branding-panel"
      style={{
        flex: '1 1 56%',
        minWidth: 0,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #7c3aed 100%)',
        color: '#fff',
        padding: '56px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1.4px)',
        backgroundSize: '22px 22px',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.55) 0%, transparent 70%)',
        top: -120,
        right: -120,
        filter: 'blur(8px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)',
        bottom: -100,
        left: -80,
        filter: 'blur(8px)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <Workflow size={20} color="#fff" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>
          WebFlow
        </h1>
      </div>

      <div style={{ position: 'relative', maxWidth: 540 }}>
        <h2 style={{
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          marginBottom: 18,
        }}>
          Do desenho ao algoritmo<br />
          rodando, em segundos.
        </h2>
        <p style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.78)',
          marginBottom: 28,
        }}>
          Uma ferramenta moderna para ensinar e aprender lógica de programação:
          desenhe o fluxograma, execute passo a passo e acompanhe cada variável
          mudando em tempo real — tudo direto no navegador, sem instalação.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Feature text="Editor visual com if/else, while e variáveis tipadas" />
          <Feature text="Execução interativa com painel de variáveis e console" />
          <Feature text="Exportação para código C equivalente" />
        </ul>
      </div>

      <div style={{ position: 'relative' }} />
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}>
        <Check size={12} strokeWidth={3} />
      </div>
      <span style={{ lineHeight: 1.45 }}>{text}</span>
    </li>
  );
}

interface FormProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  name: string;
  onNameChange: (s: string) => void;
  email: string;
  onEmailChange: (s: string) => void;
  password: string;
  onPasswordChange: (s: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  error: string | null;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  sessionEndReason: SessionEndReason;
  onDismissSessionBanner: () => void;
}

function FormPanel(p: FormProps) {
  const isLogin = p.mode === 'login';
  return (
    <div style={{
      flex: '1 1 44%',
      minWidth: 320,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      background: 'var(--bg-primary)',
    }}>
      <form
        onSubmit={p.onSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: 6,
          }}>
            {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {isLogin
              ? 'Entre com sua conta para acessar o editor.'
              : 'Comece a montar seus fluxogramas em minutos.'}
          </p>
        </div>

        {p.sessionEndReason && (
          <SessionEndedBanner reason={p.sessionEndReason} onDismiss={p.onDismissSessionBanner} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <Field label="Nome">
              <input
                value={p.name}
                onChange={(e) => p.onNameChange(e.target.value)}
                required
                minLength={1}
                placeholder="Seu nome"
                style={inputStyle}
                autoFocus
              />
            </Field>
          )}

          <Field label="E-mail">
            <input
              type="email"
              value={p.email}
              onChange={(e) => p.onEmailChange(e.target.value)}
              required
              placeholder="voce@exemplo.com"
              style={inputStyle}
              autoFocus={isLogin}
            />
          </Field>

          <Field label="Senha">
            <div style={{ position: 'relative' }}>
              <input
                type={p.showPassword ? 'text' : 'password'}
                value={p.password}
                onChange={(e) => p.onPasswordChange(e.target.value)}
                required
                minLength={!isLogin ? 8 : 1}
                placeholder={isLogin ? 'Sua senha' : 'Mínimo 8 caracteres'}
                style={{ ...inputStyle, paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={p.onTogglePassword}
                tabIndex={-1}
                aria-label={p.showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                }}
              >
                {p.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>

        {p.error && (
          <div role="alert" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            color: '#ef4444',
            fontSize: 12.5,
            padding: '10px 12px',
            borderRadius: 8,
            lineHeight: 1.4,
          }}>
            {p.error}
          </div>
        )}

        <button
          type="submit"
          disabled={p.busy}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 600,
            cursor: p.busy ? 'not-allowed' : 'pointer',
            opacity: p.busy ? 0.6 : 1,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 6px 18px rgba(124, 58, 237, 0.25)',
          }}
          onMouseEnter={(e) => {
            if (!p.busy) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {p.busy ? 'Aguarde…' : (
            <>
              {isLogin ? 'Entrar' : 'Criar conta'}
              <ArrowRight size={15} />
            </>
          )}
        </button>

        <div style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-secondary)',
          paddingTop: 6,
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 4,
        }}>
          {isLogin ? (
            <>
              Não tem conta?{' '}
              <SwitchLink onClick={() => p.onModeChange('register')}>Criar uma agora</SwitchLink>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <SwitchLink onClick={() => p.onModeChange('login')}>Entrar</SwitchLink>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function SwitchLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#7c3aed',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function SessionEndedBanner({
  reason,
  onDismiss,
}: {
  reason: Exclude<SessionEndReason, null>;
  onDismiss: () => void;
}) {
  const title = reason === 'idle' ? 'Sessão encerrada por inatividade' : 'Sessão expirada';
  const message = reason === 'idle'
    ? 'Você ficou um tempo sem usar o sistema. Por segurança, sua sessão foi encerrada — entre novamente para continuar.'
    : 'Sua sessão expirou ou não é mais válida. Entre novamente para continuar.';
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'rgba(245, 158, 11, 0.10)',
        border: '1px solid rgba(245, 158, 11, 0.32)',
      }}
    >
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        background: 'rgba(245, 158, 11, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f59e0b',
        flexShrink: 0,
      }}>
        <Clock size={15} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          marginTop: -2,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '11px 12px',
  color: 'var(--text-primary)',
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};
