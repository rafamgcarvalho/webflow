import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface TerminalData {
  label: string;
  variant: 'start' | 'end';
  [key: string]: unknown;
}

type Props = NodeProps & { data: TerminalData };

const TerminalNode = memo(({ data }: Props) => {
  const isStart = data.variant === 'start';
  return (
    <div className="animate-fade-in-up">
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
        />
      )}
      <div
        style={{
          minWidth: 180,
          height: 52,
          padding: '0 28px',
          borderRadius: 999,
          background: 'var(--node-terminal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-on-node)',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.02em',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {data.label}
      </div>
      {isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
        />
      )}
    </div>
  );
});

TerminalNode.displayName = 'TerminalNode';
export default TerminalNode;
