import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowContext } from '../../contexts/FlowContext';

interface ProcessData {
  variable: string;
  expression: string;
  statementId: string;
  [key: string]: unknown;
}

type Props = NodeProps & { data: ProcessData };

const ProcessNode = memo(({ data }: Props) => {
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
          minWidth: 220,
          height: 56,
          padding: '0 18px',
          borderRadius: 0,
          background: 'var(--node-process)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'var(--text-on-node)',
          fontSize: 13,
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        <span className="wf-node-kind">Atribuição</span>
        <span className="wf-node-label">
          {data.variable} ← {data.expression}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';
export default ProcessNode;
