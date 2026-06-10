// Helpers para montar ASTs (FlowProgram) nos testes do interpretador e do exportador C.
// Não é um arquivo de teste (não casa com *.test.ts), apenas utilitários compartilhados.
import type {
  Statement,
  FlowProgram,
  VarType,
  DeclareStatement,
  AssignStatement,
  InputStatement,
  OutputStatement,
  IfStatement,
  WhileStatement,
} from '../../types/flow';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function declare(name: string, varType: VarType): DeclareStatement {
  return { id: nextId('decl'), kind: 'declare', name, varType };
}

export function assign(variable: string, expression: string): AssignStatement {
  return { id: nextId('asg'), kind: 'assign', variable, expression };
}

export function input(variable: string): InputStatement {
  return { id: nextId('in'), kind: 'input', variable };
}

export function output(expression: string, newline = true): OutputStatement {
  return { id: nextId('out'), kind: 'output', expression, newline };
}

export function ifStmt(
  condition: string,
  thenBranch: Statement[],
  elseBranch: Statement[] = [],
): IfStatement {
  return { id: nextId('if'), kind: 'if', condition, thenBranch, elseBranch };
}

export function whileStmt(condition: string, body: Statement[]): WhileStatement {
  return { id: nextId('wh'), kind: 'while', condition, body };
}

export function program(statements: Statement[], name = 'Teste'): FlowProgram {
  return { name, statements };
}
