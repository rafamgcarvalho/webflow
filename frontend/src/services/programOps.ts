import type { FlowProgram, Statement } from '../types/flow';

export interface InsertLocation {
  branchPath: BranchStep[];
  index: number;
}

export type BranchStep =
  | { parentId: string; field: 'then' | 'else' | 'body' };

function mapStatements(
  statements: Statement[],
  fn: (s: Statement) => Statement,
): Statement[] {
  return statements.map((s) => {
    const mapped = fn(s);
    if (mapped.kind === 'if') {
      return {
        ...mapped,
        thenBranch: mapStatements(mapped.thenBranch, fn),
        elseBranch: mapStatements(mapped.elseBranch, fn),
      };
    }
    if (mapped.kind === 'while') {
      return { ...mapped, body: mapStatements(mapped.body, fn) };
    }
    return mapped;
  });
}

function updateBranch(
  statements: Statement[],
  path: BranchStep[],
  updater: (branch: Statement[]) => Statement[],
): Statement[] {
  if (path.length === 0) {
    return updater(statements);
  }
  const [step, ...rest] = path;
  return statements.map((s) => {
    if (s.id !== step.parentId) return s;
    if (s.kind === 'if' && step.field === 'then') {
      return { ...s, thenBranch: updateBranch(s.thenBranch, rest, updater) };
    }
    if (s.kind === 'if' && step.field === 'else') {
      return { ...s, elseBranch: updateBranch(s.elseBranch, rest, updater) };
    }
    if (s.kind === 'while' && step.field === 'body') {
      return { ...s, body: updateBranch(s.body, rest, updater) };
    }
    return s;
  });
}

export function insertStatement(
  program: FlowProgram,
  location: InsertLocation,
  stmt: Statement,
): FlowProgram {
  const statements = updateBranch(
    program.statements,
    location.branchPath,
    (branch) => {
      const next = [...branch];
      next.splice(location.index, 0, stmt);
      return next;
    },
  );
  return { ...program, statements };
}

export function removeStatement(
  program: FlowProgram,
  id: string,
): FlowProgram {
  function rec(branch: Statement[]): Statement[] {
    const out: Statement[] = [];
    for (const s of branch) {
      if (s.id === id) continue;
      if (s.kind === 'if') {
        out.push({
          ...s,
          thenBranch: rec(s.thenBranch),
          elseBranch: rec(s.elseBranch),
        });
      } else if (s.kind === 'while') {
        out.push({ ...s, body: rec(s.body) });
      } else {
        out.push(s);
      }
    }
    return out;
  }
  return { ...program, statements: rec(program.statements) };
}

export function updateStatement(
  program: FlowProgram,
  id: string,
  patch: Partial<Statement>,
): FlowProgram {
  const statements = mapStatements(program.statements, (s) => {
    if (s.id !== id) return s;
    return { ...s, ...patch } as Statement;
  });
  return { ...program, statements };
}

export function findStatement(
  program: FlowProgram,
  id: string,
): Statement | null {
  function rec(branch: Statement[]): Statement | null {
    for (const s of branch) {
      if (s.id === id) return s;
      if (s.kind === 'if') {
        const r = rec(s.thenBranch) || rec(s.elseBranch);
        if (r) return r;
      } else if (s.kind === 'while') {
        const r = rec(s.body);
        if (r) return r;
      }
    }
    return null;
  }
  return rec(program.statements);
}
