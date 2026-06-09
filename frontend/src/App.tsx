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
import MyFlowsModal from './components/modals/MyFlowsModal';
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
import { exportToFprg } from './services/fprgExporter';
import {
  runProgram,
  type RunController,
  type VariableInfo,
} from './services/interpreter';
import { api, ApiError } from './services/api';

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(name: string): string {
  return (name || 'fluxo').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLocation, setInsertLocation] = useState<{ branchPath: BranchStep[]; index: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myFlowsOpen, setMyFlowsOpen] = useState(false);
  const [myFlowsRefresh, setMyFlowsRefresh] = useState(0);

  const editingStatement: Statement | null = editingId
    ? findStatement(program, editingId)
    : null;

  const isRunning = runController !== null;

  // Marca o fluxo como modificado quando o programa muda (exceto no carregamento inicial)
  const skipDirtyRef = useRef(true);
  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    setDirty(true);
  }, [program]);

  const replaceProgram = useCallback((p: FlowProgram, flowId: string | null) => {
    skipDirtyRef.current = true;
    setProgram(p);
    setCurrentFlowId(flowId);
    setDirty(false);
  }, []);

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
      replaceProgram(imported, null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao importar.');
    }
  }, [replaceProgram]);

  const handleExportC = useCallback(() => {
    downloadBlob(exportToC(program), `${slugify(program.name)}.c`, 'text/x-c');
  }, [program]);

  const handleExportFprg = useCallback(() => {
    downloadBlob(exportToFprg(program), `${slugify(program.name)}.fprg`, 'application/xml');
  }, [program]);

  const handleNew = useCallback(() => {
    if (isRunning) return;
    if (program.statements.length === 0 && !currentFlowId) return;
    if (dirty && !confirm('Tem alterações não salvas. Descartar e criar um novo fluxo?')) return;
    replaceProgram(emptyProgram(), null);
    setConsoleLines([]);
    setVariables([]);
    setErrorMessage(null);
  }, [program.statements.length, isRunning, dirty, currentFlowId, replaceProgram]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = { name: program.name || 'Sem título', statements: program.statements };
      if (currentFlowId) {
        await api.updateFlow(currentFlowId, payload);
      } else {
        const { flow } = await api.createFlow(payload);
        setCurrentFlowId(flow.id);
      }
      setDirty(false);
      setMyFlowsRefresh((n) => n + 1);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [saving, program, currentFlowId]);

  const handleOpenFlow = useCallback(async (id: string) => {
    try {
      setErrorMessage(null);
      const { flow } = await api.getFlow(id);
      replaceProgram(
        { name: flow.name, statements: flow.statements as Statement[] },
        flow.id,
      );
      setConsoleLines([]);
      setVariables([]);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao abrir fluxo.');
    }
  }, [replaceProgram]);

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
      inputResolveRef.current = null;
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isRunning) handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun, handleSave, isRunning, program.statements.length]);

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
              dirty={dirty}
              saving={saving}
              hasFlowId={currentFlowId !== null}
              onSave={handleSave}
              onOpenMyFlows={() => setMyFlowsOpen(true)}
              onToggleSidebar={() => setSidebarOpen((v) => !v)}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Sidebar
                isRunning={isRunning}
                canRun={program.statements.length > 0}
                onRun={handleRun}
                onStop={handleStop}
                onImport={handleImport}
                onExportC={handleExportC}
                onExportFprg={handleExportFprg}
                onNew={handleNew}
                onAddBlock={handleAddBlockAtEnd}
                errorMessage={errorMessage}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                showVariables={showVariables}
                toggleVariables={() => setShowVariables((v) => !v)}
                showConsole={showConsole}
                toggleConsole={() => setShowConsole((v) => !v)}
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
          <MyFlowsModal
            open={myFlowsOpen}
            onClose={() => setMyFlowsOpen(false)}
            onOpenFlow={handleOpenFlow}
            refreshKey={myFlowsRefresh}
          />
        </ReactFlowProvider>
      </FlowContext.Provider>
  );
}
