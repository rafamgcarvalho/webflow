import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const JoinNode = memo(() => {
  return (
    <div style={{ width: 16, height: 16, position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: 'var(--edge-color)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 1, height: 1, background: 'transparent', border: 'none' }}
      />
    </div>
  );
});

JoinNode.displayName = 'JoinNode';
export default JoinNode;
