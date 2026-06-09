import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { Plus } from 'lucide-react';
import { useFlowContext } from '../../contexts/FlowContext';
import type { BranchStep } from '../../services/programOps';

interface InsertEdgeData {
  branchPath: BranchStep[];
  index: number;
}

const InsertEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    markerEnd,
    style,
    label,
    labelStyle,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    data,
  } = props;

  const { onInsertAt } = useFlowContext();
  const insertData = data as unknown as InsertEdgeData | undefined;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 8,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insertData) onInsertAt(insertData.branchPath, insertData.index);
  };

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + (labelX - sourceX) * 0.35}px, ${sourceY + (labelY - sourceY) * 0.35}px)`,
              pointerEvents: 'none',
              ...(labelBgStyle ? {
                background: (labelBgStyle as React.CSSProperties).fill ?? 'var(--bg-card)',
                padding: Array.isArray(labelBgPadding)
                  ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
                  : '3px 6px',
                borderRadius: labelBgBorderRadius ?? 4,
              } : {}),
              ...labelStyle,
              color: (labelStyle as React.CSSProperties)?.fill ?? 'var(--text-primary)',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {label}
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          title="Inserir bloco aqui"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'var(--insert-button-bg)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(1.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;
          }}
        >
          <Plus size={14} />
        </button>
      </EdgeLabelRenderer>
    </>
  );
});

InsertEdge.displayName = 'InsertEdge';
export default InsertEdge;
