import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

export type ConsoleLine =
  | { type: 'out'; text: string }
  | { type: 'in'; prompt: string; value: string }
  | { type: 'sys'; text: string };

interface Props {
  lines: ConsoleLine[];
  inputRequest: string | null;
  onSubmitInput: (value: string) => void;
  onClose?: () => void;
  onMaximize?: () => void;
  maximized?: boolean;
}

export default function ConsolePanel({
  lines,
  inputRequest,
  onSubmitInput,
  onClose,
  onMaximize,
  maximized,
}: Props) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRequest !== null) {
      inputRef.current?.focus();
    }
  }, [inputRequest]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, inputRequest]);

  const submit = () => {
    if (inputRequest === null) return;
    onSubmitInput(draft);
    setDraft('');
  };

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
          Console
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {onMaximize && (
            <IconBtn onClick={onMaximize} title={maximized ? 'Restaurar' : 'Maximizar'}>
              {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </IconBtn>
          )}
          {onClose && (
            <IconBtn onClick={onClose} title="Fechar painel">
              <X size={13} />
            </IconBtn>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 10,
          fontFamily: 'Consolas, Menlo, monospace',
          fontSize: 12,
          background: 'var(--bg-primary)',
        }}
      >
        {lines.length === 0 && inputRequest === null && (
          <span style={{ color: 'var(--text-muted)' }}>
            Pronto. Clique em Executar (▶) para rodar o programa.
          </span>
        )}
        {lines.map((line, i) => {
          if (line.type === 'out') {
            return <span key={i} style={{ color: 'var(--console-out)', whiteSpace: 'pre-wrap' }}>{line.text}</span>;
          }
          if (line.type === 'in') {
            return (
              <span key={i} style={{ display: 'block', color: 'var(--console-in)', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{line.prompt}</span>{line.value}
              </span>
            );
          }
          return (
            <span key={i} style={{ display: 'block', color: 'var(--console-sys)', fontStyle: 'italic' }}>
              {line.text}
            </span>
          );
        })}
      </div>

      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          color: inputRequest !== null ? 'var(--console-prompt)' : 'var(--text-muted)',
          fontFamily: 'monospace',
          fontSize: 12,
          minWidth: 12,
          fontWeight: 600,
        }}>
          {'>'}
        </span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          disabled={inputRequest === null}
          placeholder={inputRequest !== null ? `Digite o valor para "${inputRequest}" e pressione Enter` : 'Aguardando execução…'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
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
      {children}
    </button>
  );
}
