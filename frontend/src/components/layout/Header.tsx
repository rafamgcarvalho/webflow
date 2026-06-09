import {
  Workflow, Moon, Sun, Variable, Terminal, LogOut,
  Save, FolderOpen, Loader2, Circle, Menu,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile, useIsCompact } from '../../hooks/useMediaQuery';

interface Props {
  programName: string;
  onRename: (name: string) => void;

  showVariables: boolean;
  toggleVariables: () => void;
  showConsole: boolean;
  toggleConsole: () => void;

  dirty: boolean;
  saving: boolean;
  hasFlowId: boolean;
  onSave: () => void;
  onOpenMyFlows: () => void;

  onToggleSidebar: () => void;
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
  hasFlowId,
  onSave,
  onOpenMyFlows,
  onToggleSidebar,
}: Props) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const isCompact = useIsCompact();

  return (
    <header style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 8px' : '0 16px',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-subtle)',
      gap: isMobile ? 6 : 12,
      flexShrink: 0,
    }}>
      {isMobile && (
        <IconBtn onClick={onToggleSidebar} title="Menu">
          <Menu size={18} />
        </IconBtn>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
        {!isMobile && (
          <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Web<span style={{ color: '#7c3aed' }}>Flow</span>
          </h1>
        )}
      </div>

      {!isMobile && <div style={{ height: 20, width: 1, background: 'var(--border-subtle)' }} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: isMobile ? 1 : '0 1 auto' }}>
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
            minWidth: 0,
            width: '100%',
            maxWidth: isMobile ? '100%' : 220,
          }}
          onFocus={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
        />
        {!isMobile && <SaveIndicator dirty={dirty} saving={saving} hasFlowId={hasFlowId} />}
      </div>

      {!isMobile && <div style={{ flex: 1 }} />}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <IconBtn onClick={onSave} title="Salvar (Ctrl+S)" disabled={saving}>
          <Save size={isMobile ? 16 : 14} />
          {!isCompact && <span style={{ fontSize: 12, fontWeight: 500 }}>Salvar</span>}
        </IconBtn>
        <IconBtn onClick={onOpenMyFlows} title="Abrir um fluxo salvo">
          <FolderOpen size={isMobile ? 16 : 14} />
          {!isCompact && <span style={{ fontSize: 12, fontWeight: 500 }}>Meus fluxos</span>}
        </IconBtn>

        {!isMobile && <div style={{ height: 20, width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />}

        {!isMobile && (
          <>
            <ToggleBtn
              active={showVariables}
              onClick={toggleVariables}
              title="Variáveis"
              Icon={Variable}
              label={!isCompact ? 'Variáveis' : undefined}
            />
            <ToggleBtn
              active={showConsole}
              onClick={toggleConsole}
              title="Console"
              Icon={Terminal}
              label={!isCompact ? 'Console' : undefined}
            />
          </>
        )}
        <IconBtn onClick={toggle} title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </IconBtn>
        {user && (
          <>
            {!isMobile && <div style={{ height: 20, width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />}
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
                flexShrink: 0,
              }}>
                {user.name.trim().slice(0, 1).toUpperCase()}
              </div>
              {!isCompact && (
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
              )}
            </div>
            <IconBtn onClick={logout} title={`Sair (${user.email})`}>
              <LogOut size={16} />
            </IconBtn>
          </>
        )}
      </div>
    </header>
  );
}

function SaveIndicator({
  dirty,
  saving,
  hasFlowId,
}: {
  dirty: boolean;
  saving: boolean;
  hasFlowId: boolean;
}) {
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
  const unsaved = dirty || !hasFlowId;
  if (unsaved) {
    return (
      <span
        title={hasFlowId ? 'Alterações não salvas' : 'Este fluxo ainda não foi salvo na sua conta'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: '#f59e0b',
          whiteSpace: 'nowrap',
        }}
      >
        <Circle size={7} fill="currentColor" />
        Não salvo
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Salvo</span>
  );
}

function ToggleBtn({ active, onClick, title, Icon, label }: {
  active: boolean;
  onClick: () => void;
  title: string;
  Icon: React.ComponentType<{ size?: number }>;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--bg-hover)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--border-strong)' : 'var(--border-subtle)'),
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: label ? '6px 10px' : '6px 8px',
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

function IconBtn({
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
        padding: '6px 8px',
        minHeight: 32,
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
