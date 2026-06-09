export type VarType = 'Integer' | 'Real' | 'String' | 'Boolean';

export interface DeclareStatement {
  id: string;
  kind: 'declare';
  name: string;
  varType: VarType;
}

export interface AssignStatement {
  id: string;
  kind: 'assign';
  variable: string;
  expression: string;
}

export interface InputStatement {
  id: string;
  kind: 'input';
  variable: string;
}

export interface OutputStatement {
  id: string;
  kind: 'output';
  expression: string;
  newline: boolean;
}

export interface IfStatement {
  id: string;
  kind: 'if';
  condition: string;
  thenBranch: Statement[];
  elseBranch: Statement[];
}

export interface WhileStatement {
  id: string;
  kind: 'while';
  condition: string;
  body: Statement[];
}

export type Statement =
  | DeclareStatement
  | AssignStatement
  | InputStatement
  | OutputStatement
  | IfStatement
  | WhileStatement;

export interface FlowProgram {
  name: string;
  statements: Statement[];
}

export function emptyProgram(): FlowProgram {
  return { name: 'Sem título', statements: [] };
}

export function newId(prefix = 'n'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function defaultStatement(kind: Statement['kind']): Statement {
  switch (kind) {
    case 'declare':
      return { id: newId('decl'), kind, name: 'x', varType: 'Integer' };
    case 'assign':
      return { id: newId('asg'), kind, variable: 'x', expression: '0' };
    case 'input':
      return { id: newId('in'), kind, variable: 'x' };
    case 'output':
      return { id: newId('out'), kind, expression: '"texto"', newline: true };
    case 'if':
      return { id: newId('if'), kind, condition: 'x > 0', thenBranch: [], elseBranch: [] };
    case 'while':
      return { id: newId('wh'), kind, condition: 'x > 0', body: [] };
  }
}
