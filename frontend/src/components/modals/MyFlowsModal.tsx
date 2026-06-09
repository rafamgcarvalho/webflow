import { useEffect, useState } from 'react';
import { X, Trash2, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { api, ApiError, type ApiFlowSummary } from '../../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenFlow: (id: string) => void;
  refreshKey: number;
}

export default function MyFlowsModal({ open, onClose, onOpenFlow, refreshKey }: Props) {
  const [flows, setFlows] = useState<ApiFlowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api.listFlows()
      .then(({ flows }) => setFlows(flows))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar fluxos.');
      })
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteFlow(id);
      setFlows((list) => list.filter((f) => f.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao excluir.');
    }
  };

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
          width: 540,
          maxWidth: '92vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={18} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Meus fluxos
            </h3>
          </div>
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

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Carregando…
            </div>
          )}
          {error && (
            <div style={{
              padding: 14,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              color: '#ef4444',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          {!loading && !error && flows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Você ainda não tem fluxos salvos. Crie um e clique em "Salvar".
            </div>
          )}
          {!loading && !error && flows.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {flows.map((flow) => (
                <FlowRow
                  key={flow.id}
                  flow={flow}
                  onOpen={() => { onOpenFlow(flow.id); onClose(); }}
                  onDelete={() => handleDelete(flow.id, flow.name)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  flow,
  onOpen,
  onDelete,
}: {
  flow: ApiFlowSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const date = new Date(flow.updatedAt);
  const dateStr = date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return (
    <li>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease',
      }}>
        <FileText size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <button
          onClick={onOpen}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
            minWidth: 0,
          }}
        >
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {flow.name}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 400,
            marginTop: 2,
          }}>
            Atualizado em {dateStr}
          </div>
        </button>
        <button
          onClick={onDelete}
          title="Excluir"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: '#ef4444',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}
