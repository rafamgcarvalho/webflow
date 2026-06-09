import { Workflow, Moon, Sun, Variable, Terminal, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  programName: string;
  onRename: (name: string) => void;

  showVariables: boolean;
  toggleVariables: () => void;
  showConsole: boolean;
  toggleConsole: () => void;
}

export default function Header({
  programName,
  onRename,
  showVariables,
  toggleVariables,
  showConsole,
  toggleConsole,
}: Props) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-subtle)',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Workflow size={15} color="#fff" />
        </div>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Web<span style={{ color: '#7c3aed' }}>Flow</span>
        </h1>
      </div>

      <div style={{ height: 20, width: 1, background: 'var(--border-subtle)' }} />

      <input
        value={programName}
        onChange={(e) => onRename(e.target.value)}
        placeholder="Sem título"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
          outline: 'none',
          padding: '4px 8px',
          borderRadius: 4,
          minWidth: 160,
        }}
        onFocus={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
      />

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 6 }}>
        <ToggleBtn
          active={showVariables}
          onClick={toggleVariables}
          title="Visualizar Variáveis"
          Icon={Variable}
          label="Variáveis"
        />
        <ToggleBtn
          active={showConsole}
          onClick={toggleConsole}
          title="Console"
          Icon={Terminal}
          label="Console"
        />
        <div style={{ width: 6 }} />
        <HeaderBtn onClick={toggle} title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </HeaderBtn>
        {user && (
          <HeaderBtn onClick={logout} title={`Sair (${user.email})`}>
            <LogOut size={16} />
          </HeaderBtn>
        )}
      </div>
    </header>
  );
}

function ToggleBtn({ active, onClick, title, Icon, label }: {
  active: boolean;
  onClick: () => void;
  title: string;
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--bg-hover)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--border-strong)' : 'var(--border-subtle)'),
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '6px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function HeaderBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}
