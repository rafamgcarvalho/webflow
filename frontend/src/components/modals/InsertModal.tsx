import { useEffect } from 'react';
import { ArrowLeftRight, Download, Upload, Variable, GitBranch, Repeat, X } from 'lucide-react';
import type { Statement } from '../../types/flow';
import { defaultStatement } from '../../types/flow';

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (stmt: Statement) => void;
}

const OPTIONS: Array<{
  kind: Statement['kind'];
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number }>;
  color: string;
}> = [
  { kind: 'declare', label: 'Declaração', description: 'Criar uma variável.',
    Icon: Variable, color: 'var(--node-declare)' },
  { kind: 'assign', label: 'Atribuição', description: 'Atribuir valor a uma variável.',
    Icon: ArrowLeftRight, color: 'var(--node-process)' },
  { kind: 'input', label: 'Entrada', description: 'Ler um valor do usuário.',
    Icon: Download, color: 'var(--node-input)' },
  { kind: 'output', label: 'Saída', description: 'Imprimir no console.',
    Icon: Upload, color: 'var(--node-output)' },
  { kind: 'if', label: 'Se / Senão', description: 'Estrutura condicional.',
    Icon: GitBranch, color: 'var(--node-control)' },
  { kind: 'while', label: 'Enquanto', description: 'Laço de repetição.',
    Icon: Repeat, color: 'var(--node-control)' },
];

export default function InsertModal({ open, onClose, onChoose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          padding: 20,
          width: 460,
          maxWidth: '90vw',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Inserir bloco
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              onClick={() => onChoose(defaultStatement(opt.kind))}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                borderRadius: 8,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: opt.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <opt.Icon size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {opt.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
