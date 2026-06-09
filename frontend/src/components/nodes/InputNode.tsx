import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowContext } from '../../contexts/FlowContext';

interface InputData {
  variable: string;
  statementId: string;
  [key: string]: unknown;
}

type Props = NodeProps & { data: InputData };

const InputNode = memo(({ data }: Props) => {
  const { activeStatementId } = useFlowContext();
  const isActive = activeStatementId === data.statementId;

  return (
    <div className="animate-fade-in-up">
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
      <div
        className={isActive ? 'node-active' : ''}
        style={{
          minWidth: 240,
          height: 56,
          background: 'var(--node-input)',
          transform: 'skewX(-15deg)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            transform: 'skewX(15deg)',
            height: '100%',
            padding: '0 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: 'var(--text-on-node)',
          }}
        >
          <span className="wf-node-kind">Entrada</span>
          <span className="wf-node-label">Leia: {data.variable}</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';
export default InputNode;
