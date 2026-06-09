import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Props {
  canvas: ReactNode;
  variables: ReactNode | null;
  consolePanel: ReactNode | null;
}

export default function Workspace({ canvas, variables, consolePanel }: Props) {
  const isMobile = useIsMobile();
  const hasOverlay = variables !== null || consolePanel !== null;

  if (isMobile) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        position: 'relative',
        padding: 6,
      }}>
        <div style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {canvas}
        </div>
        {hasOverlay && (
          <div style={{
            position: 'absolute',
            left: 6,
            right: 6,
            bottom: 6,
            top: '45%',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 20,
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

      {hasOverlay && (
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
