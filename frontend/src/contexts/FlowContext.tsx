import { createContext, useContext } from 'react';
import type { BranchStep } from '../services/programOps';

interface FlowContextValue {
  activeStatementId: string | null;
  onEditStatement: (id: string) => void;
  onDeleteStatement: (id: string) => void;
  onInsertAt: (branchPath: BranchStep[], index: number) => void;
}

export const FlowContext = createContext<FlowContextValue>({
  activeStatementId: null,
  onEditStatement: () => {},
  onDeleteStatement: () => {},
  onInsertAt: () => {},
});

export const useFlowContext = () => useContext(FlowContext);
