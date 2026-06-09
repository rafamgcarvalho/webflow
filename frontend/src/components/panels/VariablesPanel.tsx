import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { VariableInfo } from '../../services/interpreter';
import { formatValue } from '../../services/interpreter';
import type { VarType } from '../../types/flow';

interface Props {
  variables: VariableInfo[];
  onClose?: () => void;
}

const TYPE_COLOR: Record<VarType, string> = {
  Integer: '#7c3aed',
  Real: '#2563eb',
  String: '#059669',
  Boolean: '#d97706',
};

export default function VariablesPanel({ variables, onClose }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Visualizar Variáveis
        </span>
        {onClose && (
          <button
            onClick={onClose}
            title="Fechar painel"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 4,
              display: 'flex',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={13} />
          </button>
        )}
      </header>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 12,
        background: 'var(--bg-primary)',
      }}>
        {variables.length === 0 ? (
          <div style={{
            padding: 20,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            Nenhuma variável declarada.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
          }}>
            {variables.map((v) => (
              <VariableCard key={v.name} info={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VariableCard({ info }: { info: VariableInfo }) {
  const color = TYPE_COLOR[info.type];
  const prevValueRef = useRef(info.value);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevValueRef.current !== info.value && cardRef.current) {
      const el = cardRef.current;
      el.style.transform = 'scale(1.04)';
      el.style.boxShadow = `0 0 0 2px ${color}55, 0 6px 16px rgba(0,0,0,0.2)`;
      const t = setTimeout(() => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '';
      }, 220);
      return () => clearTimeout(t);
    }
    prevValueRef.current = info.value;
  }, [info.value, color]);

  return (
    <div
      ref={cardRef}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{
        background: color,
        color: '#fff',
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {info.name}
        </span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          background: 'rgba(255,255,255,0.2)',
          padding: '1px 6px',
          borderRadius: 3,
          textTransform: 'uppercase',
        }}>
          {info.type}
        </span>
      </div>
      <div style={{
        padding: '10px 10px 12px',
        fontFamily: 'Consolas, Menlo, monospace',
        fontSize: 13,
        color: info.value === undefined ? 'var(--text-muted)' : 'var(--text-primary)',
        fontStyle: info.value === undefined ? 'italic' : 'normal',
        wordBreak: 'break-all',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
      }}>
        {info.value === undefined ? 'indefinido' : formatValue(info.value)}
      </div>
    </div>
  );
}
