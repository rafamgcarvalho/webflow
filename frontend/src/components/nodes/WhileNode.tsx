import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowContext } from '../../contexts/FlowContext';

interface WhileData {
  condition: string;
  statementId: string;
  [key: string]: unknown;
}

type Props = NodeProps & { data: WhileData };

const W = 200;
const H = 80;
const CORNER = 24; // recuo das pontas laterais

const HEX_POINTS = [
  `${CORNER},0`,
  `${W - CORNER},0`,
  `${W},${H / 2}`,
  `${W - CORNER},${H}`,
  `${CORNER},${H}`,
  `0,${H / 2}`,
].join(' ');

const WhileNode = memo(({ data }: Props) => {
  const { activeStatementId } = useFlowContext();
  const isActive = activeStatementId === data.statementId;
  const display = data.condition.length > 22
    ? data.condition.slice(0, 22) + '…'
    : data.condition;

  return (
    <div className="animate-fade-in-up" style={{ position: 'relative', width: W, height: H }}>
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />

      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <polygon
          points={HEX_POINTS}
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
          padding: `0 ${CORNER + 8}px`,
          textAlign: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span className="wf-node-kind">Enquanto</span>
        <span className="wf-node-label" title={data.condition}>{display}</span>
      </div>

      {/* Saída "verdadeiro" pela ponta direita */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{
          left: W,
          top: H / 2,
          width: 1,
          height: 1,
          background: 'transparent',
          border: 'none',
        }}
      />
      {/* Loop-back entra logo abaixo, na ponta direita */}
      <Handle
        id="rightTarget"
        type="target"
        position={Position.Right}
        style={{
          left: W,
          top: H / 2 + 14,
          width: 1,
          height: 1,
          background: 'transparent',
          border: 'none',
        }}
      />

      {/* Saída "falso" pelo bottom */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
    </div>
  );
});

WhileNode.displayName = 'WhileNode';
export default WhileNode;
