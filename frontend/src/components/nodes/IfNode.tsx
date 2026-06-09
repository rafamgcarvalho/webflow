import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowContext } from '../../contexts/FlowContext';

interface IfData {
  condition: string;
  statementId: string;
  [key: string]: unknown;
}

type Props = NodeProps & { data: IfData };

const DIAMOND_W = 200;
const DIAMOND_H = 80;

const IfNode = memo(({ data }: Props) => {
  const { activeStatementId } = useFlowContext();
  const isActive = activeStatementId === data.statementId;
  const display = data.condition.length > 22
    ? data.condition.slice(0, 22) + '…'
    : data.condition;

  return (
    <div
      className="animate-fade-in-up"
      style={{ position: 'relative', width: DIAMOND_W, height: DIAMOND_H }}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />

      {/* Losango via SVG para a forma + texto sobreposto */}
      <svg
        width={DIAMOND_W}
        height={DIAMOND_H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <polygon
          points={`${DIAMOND_W / 2},0 ${DIAMOND_W},${DIAMOND_H / 2} ${DIAMOND_W / 2},${DIAMOND_H} 0,${DIAMOND_H / 2}`}
          fill="var(--node-control)"
          stroke={isActive ? 'var(--active-ring)' : 'transparent'}
          strokeWidth={isActive ? 4 : 0}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-on-node)',
          padding: '0 32px',
          textAlign: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span className="wf-node-kind">Se</span>
        <span className="wf-node-label" title={data.condition}>{display}</span>
      </div>

      {/* Handle "verdadeiro" — esquerda */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        style={{
          left: 0,
          top: DIAMOND_H / 2,
          width: 1,
          height: 1,
          background: 'transparent',
          border: 'none',
        }}
      />
      {/* Handle "falso" — direita */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{
          left: DIAMOND_W,
          top: DIAMOND_H / 2,
          width: 1,
          height: 1,
          background: 'transparent',
          border: 'none',
        }}
      />
    </div>
  );
});

IfNode.displayName = 'IfNode';
export default IfNode;
