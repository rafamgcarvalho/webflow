import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Workspace from './components/layout/Workspace';
import FlowCanvas from './components/canvas/FlowCanvas';
import VariablesPanel from './components/panels/VariablesPanel';
import ConsolePanel, { type ConsoleLine } from './components/panels/ConsolePanel';
import InsertModal from './components/modals/InsertModal';
import EditStatementModal from './components/modals/EditStatementModal';
import { FlowContext } from './contexts/FlowContext';

import type { FlowProgram, Statement } from './types/flow';
import { emptyProgram } from './types/flow';
import {
  insertStatement,
  removeStatement,
  updateStatement,
  findStatement,
  type BranchStep,
} from './services/programOps';
import { importFprgFile } from './services/fprgParser';
import { exportToC } from './services/cExporter';
import {
  runProgram,
  type RunController,
  type VariableInfo,
} from './services/interpreter';

export default function App() {
  const [program, setProgram] = useState<FlowProgram>(emptyProgram);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeStatementId, setActiveStatementId] = useState<string | null>(null);
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [inputRequest, setInputRequest] = useState<string | null>(null);
  const inputResolveRef = useRef<((v: string) => void) | null>(null);
  const [runController, setRunController] = useState<RunController | null>(null);

  const [showVariables, setShowVariables] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLocation, setInsertLocation] = useState<{ branchPath: BranchStep[]; index: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingStatement: Statement | null = editingId
    ? findStatement(program, editingId)
    : null;

  const isRunning = runController !== null;

  const handleInsertAt = useCallback((branchPath: BranchStep[], index: number) => {
    if (isRunning) return;
    setInsertLocation({ branchPath, index });
    setInsertModalOpen(true);
  }, [isRunning]);

  const handleConfirmInsert = useCallback((stmt: Statement) => {
    if (!insertLocation) return;
    setProgram((p) => insertStatement(p, insertLocation, stmt));
    setInsertModalOpen(false);
    setInsertLocation(null);
    setEditingId(stmt.id);
  }, [insertLocation]);

  const handleEdit = useCallback((id: string) => {
    if (isRunning) return;
    setEditingId(id);
  }, [isRunning]);

  const handleSaveEdit = useCallback((s: Statement) => {
    setProgram((p) => updateStatement(p, s.id, s));
    setEditingId(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProgram((p) => removeStatement(p, id));
  }, []);

  const handleAddBlockAtEnd = useCallback(() => {
    if (isRunning) return;
    setInsertLocation({ branchPath: [], index: program.statements.length });
    setInsertModalOpen(true);
  }, [program.statements.length, isRunning]);

  const handleImport = useCallback(async (file: File) => {
    try {
      setErrorMessage(null);
      const imported = await importFprgFile(file);
      setProgram(imported);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao importar.');
    }
  }, []);

  const handleExportC = useCallback(() => {
    const code = exportToC(program);
    const blob = new Blob([code], { type: 'text/x-c;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(program.name || 'programa').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.c`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [program]);

  const handleNew = useCallback(() => {
    if (isRunning) return;
    if (program.statements.length === 0) return;
    if (confirm('Tem certeza? O fluxo atual será descartado.')) {
      setProgram(emptyProgram());
      setConsoleLines([]);
      setVariables([]);
      setErrorMessage(null);
    }
  }, [program.statements.length, isRunning]);

  const requestInput = useCallback((varName: string): Promise<string> => {
    setInputRequest(varName);
    return new Promise<string>((resolve) => {
      inputResolveRef.current = resolve;
    });
  }, []);

  const submitInput = useCallback((value: string) => {
    if (inputResolveRef.current) {
      setConsoleLines((lines) => [...lines, {
        type: 'in',
        prompt: `${inputRequest ?? 'entrada'} = `,
        value,
      }]);
      inputResolveRef.current(value);
      inputResolveRef.current = null;
      setInputRequest(null);
    }
  }, [inputRequest]);

  const handleRun = useCallback(() => {
    setConsoleLines([{ type: 'sys', text: '— início da execução —' }]);
    setVariables([]);
    setErrorMessage(null);
    setShowVariables(true);
    setShowConsole(true);

    const controller = runProgram(program, {
      onOutput: (text, newline) => {
        setConsoleLines((lines) => [...lines, {
          type: 'out',
          text: text + (newline ? '\n' : ''),
        }]);
      },
      onInput: requestInput,
      onVariables: setVariables,
      onActiveStatement: setActiveStatementId,
      onError: (msg) => {
        setConsoleLines((lines) => [...lines, { type: 'sys', text: `Erro: ${msg}` }]);
      },
    });

    setRunController(controller);

    controller.promise.finally(() => {
      setRunController(null);
      setInputRequest(null);
      setConsoleLines((lines) => [...lines, { type: 'sys', text: '— fim da execução —' }]);
    });
  }, [program, requestInput]);

  const handleStop = useCallback(() => {
    if (runController) {
      runController.abort();
    }
  }, [runController]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (!isRunning && program.statements.length > 0) handleRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun, isRunning, program.statements.length]);

  return (
    <FlowContext.Provider value={{
        activeStatementId,
        onEditStatement: handleEdit,
        onDeleteStatement: handleDelete,
        onInsertAt: handleInsertAt,
      }}>
        <ReactFlowProvider>
          <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
            overflow: 'hidden',
          }}>
            <Header
              programName={program.name}
              onRename={(name) => setProgram((p) => ({ ...p, name }))}
              showVariables={showVariables}
              toggleVariables={() => setShowVariables((v) => !v)}
              showConsole={showConsole}
              toggleConsole={() => setShowConsole((v) => !v)}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Sidebar
                isRunning={isRunning}
                canRun={program.statements.length > 0}
                onRun={handleRun}
                onStop={handleStop}
                onImport={handleImport}
                onExportC={handleExportC}
                onNew={handleNew}
                onAddBlock={handleAddBlockAtEnd}
                errorMessage={errorMessage}
              />

              <Workspace
                canvas={<FlowCanvas program={program} editMode={!isRunning} />}
                variables={showVariables
                  ? <VariablesPanel variables={variables} onClose={() => setShowVariables(false)} />
                  : null}
                consolePanel={showConsole
                  ? <ConsolePanel
                      lines={consoleLines}
                      inputRequest={inputRequest}
                      onSubmitInput={submitInput}
                      onClose={() => setShowConsole(false)}
                    />
                  : null}
              />
            </div>
          </div>

          <InsertModal
            open={insertModalOpen}
            onClose={() => setInsertModalOpen(false)}
            onChoose={handleConfirmInsert}
          />
          <EditStatementModal
            statement={editingStatement}
            onSave={handleSaveEdit}
            onClose={() => setEditingId(null)}
            onDelete={handleDelete}
          />
        </ReactFlowProvider>
      </FlowContext.Provider>
  );
}
