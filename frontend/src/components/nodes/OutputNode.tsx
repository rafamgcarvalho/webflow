import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowContext } from '../../contexts/FlowContext';

interface OutputData {
  expression: string;
  newline: boolean;
  statementId: string;
  [key: string]: unknown;
}

type Props = NodeProps & { data: OutputData };

const OutputNode = memo(({ data }: Props) => {
  const { activeStatementId } = useFlowContext();
  const isActive = activeStatementId === data.statementId;
  const displayExpr = data.expression.length > 32
    ? data.expression.slice(0, 32) + '…'
    : data.expression;

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
          background: 'var(--node-output)',
          transform: 'skewX(15deg)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            transform: 'skewX(-15deg)',
            height: '100%',
            padding: '0 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: 'var(--text-on-node)',
          }}
        >
          <span className="wf-node-kind">Saída</span>
          <span className="wf-node-label">Escreva: {displayExpr}</span>
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

OutputNode.displayName = 'OutputNode';
export default OutputNode;
