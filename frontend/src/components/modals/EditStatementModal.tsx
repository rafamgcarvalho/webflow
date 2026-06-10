import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Statement, VarType } from '../../types/flow';

interface Props {
  statement: Statement | null;
  onSave: (s: Statement) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const VAR_TYPES: VarType[] = ['Integer', 'Real', 'String', 'Boolean'];

export default function EditStatementModal({ statement, onSave, onClose, onDelete }: Props) {
  const [draft, setDraft] = useState<Statement | null>(statement);

  useEffect(() => {
    setDraft(statement);
  }, [statement]);

  useEffect(() => {
    if (!statement) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (draft) onSave(draft);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [statement, draft, onClose, onSave]);

  if (!statement || !draft) return null;

  const update = (patch: Partial<Statement>) => {
    setDraft({ ...draft, ...patch } as Statement);
  };

  const renderFields = () => {
    switch (draft.kind) {
      case 'declare':
        return (
          <>
            <Field label="Nome da variável">
              <input
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Field label="Tipo">
              <select
                value={draft.varType}
                onChange={(e) => update({ varType: e.target.value as VarType })}
                style={inputStyle}
              >
                {VAR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </>
        );
      case 'assign':
        return (
          <>
            <Field label="Variável de destino">
              <input
                value={draft.variable}
                onChange={(e) => update({ variable: e.target.value })}
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Field label="Expressão">
              <input
                value={draft.expression}
                onChange={(e) => update({ expression: e.target.value })}
                style={inputStyle}
                placeholder="Ex: x + 1, a * 2, &quot;texto&quot;"
              />
            </Field>
          </>
        );
      case 'input':
        return (
          <Field label="Variável que receberá o valor">
            <input
              value={draft.variable}
              onChange={(e) => update({ variable: e.target.value })}
              style={inputStyle}
              autoFocus
            />
          </Field>
        );
      case 'output':
        return (
          <>
            <Field label="Expressão a imprimir">
              <input
                value={draft.expression}
                onChange={(e) => update({ expression: e.target.value })}
                style={inputStyle}
                autoFocus
                placeholder='Ex: x, "Olá " & nome, x + y'
              />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={draft.newline}
                onChange={(e) => update({ newline: e.target.checked })}
              />
              Quebrar linha após imprimir
            </label>
          </>
        );
      case 'if':
        return (
          <Field label="Condição">
            <input
              value={draft.condition}
              onChange={(e) => update({ condition: e.target.value })}
              style={inputStyle}
              autoFocus
              placeholder="Ex: x > 0, a == b, nome != &quot;&quot;"
            />
          </Field>
        );
      case 'while':
        return (
          <Field label="Condição (continua enquanto verdadeira)">
            <input
              value={draft.condition}
              onChange={(e) => update({ condition: e.target.value })}
              style={inputStyle}
              autoFocus
              placeholder="Ex: contador < 10"
            />
          </Field>
        );
    }
  };

  const title: Record<Statement['kind'], string> = {
    declare: 'Editar declaração',
    assign: 'Editar atribuição',
    input: 'Editar entrada',
    output: 'Editar saída',
    if: 'Editar condicional',
    while: 'Editar laço enquanto',
  };

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
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
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
            {title[draft.kind]}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {renderFields()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 8 }}>
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Excluir este bloco? Esta ação não pode ser desfeita.')) {
                  onDelete(draft.id);
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Trash2 size={14} />
              Excluir
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                background: 'var(--node-process)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Salvar
            </button>
          </div>
        </div>

        <div style={{
          marginTop: 12,
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          <strong>Ctrl+Enter</strong> para salvar · <strong>Esc</strong> para cancelar
        </div>
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
  padding: '8px 10px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};
