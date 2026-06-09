import type { ReactNode } from 'react';

interface Props {
  canvas: ReactNode;
  variables: ReactNode | null;
  consolePanel: ReactNode | null;
}

export default function Workspace({ canvas, variables, consolePanel }: Props) {
  const hasRightColumn = variables !== null || consolePanel !== null;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
      gap: 8,
      padding: 8,
    }}>
      <div style={{
        flex: 1,
        minWidth: 0,
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {canvas}
      </div>

      {hasRightColumn && (
        <div style={{
          flex: '0 0 38%',
          minWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {variables && (
            <div style={{ flex: '1 1 0', minHeight: 0 }}>{variables}</div>
          )}
          {consolePanel && (
            <div style={{ flex: '1 1 0', minHeight: 0 }}>{consolePanel}</div>
          )}
        </div>
      )}
    </div>
  );
}
