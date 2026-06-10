import { useRef, type ChangeEvent } from 'react';
import {
  Play,
  Square,
  Upload as UploadIcon,
  FileCode,
  Trash,
  Plus,
  X,
  Variable,
  Terminal,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

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

  open: boolean;
  onClose: () => void;

  showVariables: boolean;
  toggleVariables: () => void;
  showConsole: boolean;
  toggleConsole: () => void;
}

export default function Sidebar(props: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) props.onImport(f);
    e.target.value = '';
    if (isMobile) props.onClose();
  };

  const wrap = (action: () => void) => () => {
    action();
    if (isMobile) props.onClose();
  };

  if (isMobile && !props.open) return null;

  return (
    <>
      {isMobile && (
        <div
          onClick={props.onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 80,
          }}
        />
      )}
      <aside style={{
        width: isMobile ? 280 : 250,
        maxWidth: '85vw',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        overflow: 'auto',
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 90,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        } : {}),
      }}>
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>Menu</span>
          <button
            onClick={props.onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Section title="Execução">
        {props.isRunning ? (
          <BigButton label="Parar" Icon={Square} onClick={wrap(props.onStop)} color="#ef4444" />
        ) : (
          <BigButton label="Executar" Icon={Play} onClick={wrap(props.onRun)} color="#10b981" disabled={!props.canRun} />
        )}
      </Section>

      {isMobile && (
        <Section title="Painéis">
          <SmallButton
            label={`${props.showVariables ? 'Ocultar' : 'Mostrar'} variáveis`}
            Icon={Variable}
            onClick={wrap(props.toggleVariables)}
          />
          <SmallButton
            label={`${props.showConsole ? 'Ocultar' : 'Mostrar'} console`}
            Icon={Terminal}
            onClick={wrap(props.toggleConsole)}
          />
        </Section>
      )}

      <Section title="Edição">
        <SmallButton label="Adicionar bloco" Icon={Plus} onClick={wrap(props.onAddBlock)} />
        <SmallButton label="Novo fluxo" Icon={Trash} onClick={wrap(props.onNew)} />
      </Section>

      <Section title="Arquivo">
        <SmallButton label="Importar .fprg" Icon={UploadIcon} onClick={() => fileInputRef.current?.click()} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".fprg,.xml"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <SmallButton label="Exportar para C" Icon={FileCode} onClick={wrap(props.onExportC)} />
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
        <Legend shape="oval" color="var(--node-terminal)" label="Início / Fim" />
        <Legend shape="dashed" color="var(--node-declare)" label="Declaração" />
        <Legend shape="rect" color="var(--node-process)" label="Atribuição" />
        <Legend shape="paraLeft" color="var(--node-input)" label="Entrada" />
        <Legend shape="paraRight" color="var(--node-output)" label="Saída" />
        <Legend shape="diamond" color="var(--node-control)" label="Se (condicional)" />
        <Legend shape="hex" color="var(--node-control)" label="Enquanto (laço)" />
      </Section>

      <div style={{ marginTop: 'auto', padding: 14, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Clique num bloco para editar. Clique no <span style={{ color: 'var(--insert-button-bg)', fontWeight: 600 }}>+</span> para inserir.
      </div>
      </aside>
    </>
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

type ShapeKind = 'oval' | 'rect' | 'dashed' | 'paraLeft' | 'paraRight' | 'diamond' | 'hex';

function Legend({ shape, color, label }: { shape: ShapeKind; color: string; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 0',
      fontSize: 12,
      color: 'var(--text-secondary)',
    }}>
      <ShapeIcon shape={shape} color={color} />
      <span>{label}</span>
    </div>
  );
}

function ShapeIcon({ shape, color }: { shape: ShapeKind; color: string }) {
  const W = 28;
  const H = 16;
  const common = { fill: color, stroke: 'rgba(0,0,0,0.18)', strokeWidth: 1 } as const;

  let element: React.ReactNode;
  switch (shape) {
    case 'oval':
      element = <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={H / 2} ry={H / 2} {...common} />;
      break;
    case 'rect':
      element = <rect x={0.5} y={0.5} width={W - 1} height={H - 1} {...common} />;
      break;
    case 'dashed':
      element = <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={1} ry={1} fill={color} stroke="rgba(255,255,255,0.85)" strokeWidth={1} strokeDasharray="2 1.5" />;
      break;
    case 'paraLeft':
      element = <polygon points={`5,1 ${W - 1},1 ${W - 5},${H - 1} 1,${H - 1}`} {...common} />;
      break;
    case 'paraRight':
      element = <polygon points={`1,1 ${W - 5},1 ${W - 1},${H - 1} 5,${H - 1}`} {...common} />;
      break;
    case 'diamond':
      element = <polygon points={`${W / 2},1 ${W - 1},${H / 2} ${W / 2},${H - 1} 1,${H / 2}`} {...common} />;
      break;
    case 'hex':
      element = <polygon points={`5,1 ${W - 5},1 ${W - 1},${H / 2} ${W - 5},${H - 1} 5,${H - 1} 1,${H / 2}`} {...common} />;
      break;
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      {element}
    </svg>
  );
}
