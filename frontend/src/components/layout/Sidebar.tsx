import { useRef, type ChangeEvent } from 'react';
import {
  Play,
  Square,
  Upload as UploadIcon,
  FileCode,
  Trash,
  Plus,
} from 'lucide-react';

interface Props {
  isRunning: boolean;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
  onImport: (file: File) => void;
  onExportC: () => void;
  onNew: () => void;
  onAddBlock: () => void;
  errorMessage: string | null;
}

export default function Sidebar(props: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) props.onImport(f);
    e.target.value = '';
  };

  return (
    <aside style={{
      width: 250,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      overflow: 'auto',
    }}>
      {/* Execução */}
      <Section title="Execução">
        {props.isRunning ? (
          <BigButton
            label="Parar"
            Icon={Square}
            onClick={props.onStop}
            color="#ef4444"
          />
        ) : (
          <BigButton
            label="Executar"
            Icon={Play}
            onClick={props.onRun}
            color="#10b981"
            disabled={!props.canRun}
          />
        )}
      </Section>

      {/* Edição */}
      <Section title="Edição">
        <SmallButton label="Adicionar bloco" Icon={Plus} onClick={props.onAddBlock} />
        <SmallButton label="Novo fluxo" Icon={Trash} onClick={props.onNew} />
      </Section>

      {/* Arquivo */}
      <Section title="Arquivo">
        <SmallButton
          label="Importar .fprg"
          Icon={UploadIcon}
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".fprg,.xml"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <SmallButton label="Exportar para C" Icon={FileCode} onClick={props.onExportC} />
      </Section>

      {props.errorMessage && (
        <div style={{
          margin: '0 14px 14px',
          padding: 10,
          borderRadius: 6,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171',
          fontSize: 11,
          lineHeight: 1.5,
        }}>
          {props.errorMessage}
        </div>
      )}

      <Section title="Blocos">
        <Legend color="var(--node-terminal)" label="Início / Fim" />
        <Legend color="var(--node-declare)" label="Declaração" />
        <Legend color="var(--node-process)" label="Atribuição" />
        <Legend color="var(--node-input)" label="Entrada" />
        <Legend color="var(--node-output)" label="Saída" />
        <Legend color="var(--node-control)" label="Se / Enquanto" />
      </Section>

      <div style={{ marginTop: 'auto', padding: 14, fontSize: 10, color: 'var(--text-muted)' }}>
        Dica: clique duplo num bloco para editar.
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 14,
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <h3 style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function BigButton({ label, Icon, onClick, color, disabled }: {
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 6,
        background: color,
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function SmallButton({ label, Icon, onClick }: {
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        background: 'var(--bg-hover)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
      <span style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

