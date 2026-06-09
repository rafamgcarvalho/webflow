import {
  Workflow, Moon, Sun, Variable, Terminal, LogOut,
  Save, FolderOpen, Loader2, Circle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  programName: string;
  onRename: (name: string) => void;

  showVariables: boolean;
  toggleVariables: () => void;
  showConsole: boolean;
  toggleConsole: () => void;

  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onOpenMyFlows: () => void;
}

export default function Header({
  programName,
  onRename,
  showVariables,
  toggleVariables,
  showConsole,
  toggleConsole,
  dirty,
  saving,
  onSave,
  onOpenMyFlows,
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
      gap: 12,
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
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
            minWidth: 140,
            maxWidth: 220,
          }}
          onFocus={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
        />
        <SaveIndicator dirty={dirty} saving={saving} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <HeaderBtn onClick={onSave} title="Salvar (Ctrl+S)" disabled={saving}>
          <Save size={14} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Salvar</span>
        </HeaderBtn>
        <HeaderBtn onClick={onOpenMyFlows} title="Abrir um fluxo salvo">
          <FolderOpen size={14} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Meus fluxos</span>
        </HeaderBtn>

        <div style={{ height: 20, width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />

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
        <HeaderBtn onClick={toggle} title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </HeaderBtn>
        {user && (
          <>
            <div style={{ height: 20, width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 6px 4px 4px',
              borderRadius: 6,
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {user.name.trim().slice(0, 1).toUpperCase()}
              </div>
              <span style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 500,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.name}
              </span>
            </div>
            <HeaderBtn onClick={logout} title={`Sair (${user.email})`}>
              <LogOut size={16} />
            </HeaderBtn>
          </>
        )}
      </div>
    </header>
  );
}

function SaveIndicator({ dirty, saving }: { dirty: boolean; saving: boolean }) {
  if (saving) {
    return (
      <span style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: 'var(--text-muted)',
      }}>
        <Loader2 size={11} className="animate-spin" />
        Salvando…
      </span>
    );
  }
  if (dirty) {
    return (
      <span title="Alterações não salvas" style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: '#f59e0b',
      }}>
        <Circle size={7} fill="currentColor" />
        Não salvo
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
      Salvo
    </span>
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

function HeaderBtn({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        padding: '6px 10px',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
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
