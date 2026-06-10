import { describe, it, expect } from 'vitest';
import {
  insertStatement,
  removeStatement,
  updateStatement,
  findStatement,
} from '../programOps';
import type { AssignStatement, IfStatement, WhileStatement } from '../../types/flow';
import { declare, assign, output, ifStmt, whileStmt, program } from './astBuilders';

// Programa de referência com ramos then/else e corpo de while aninhados.
function sample() {
  const ifNode = ifStmt('x > 0', [assign('x', '1')], [assign('x', '2')]);
  const whileNode = whileStmt('x < 10', [assign('x', 'x + 1')]);
  const prog = program([declare('x', 'Integer'), ifNode, whileNode]);
  return { prog, ifNode, whileNode };
}

describe('programOps — insertStatement', () => {
  it('insere no nível raiz sem mutar o original', () => {
    const { prog } = sample();
    const before = prog.statements.length;
    const next = insertStatement(prog, { branchPath: [], index: before }, output('"fim"'));
    expect(next.statements.length).toBe(before + 1);
    expect(prog.statements.length).toBe(before); // original intacto
    expect(next).not.toBe(prog);
  });

  it('insere no ramo then de um if', () => {
    const { prog, ifNode } = sample();
    const next = insertStatement(
      prog,
      { branchPath: [{ parentId: ifNode.id, field: 'then' }], index: 0 },
      output('"novo"'),
    );
    const nextIf = next.statements.find((s) => s.id === ifNode.id) as IfStatement;
    expect(nextIf.thenBranch.length).toBe(2);
    expect(ifNode.thenBranch.length).toBe(1); // original intacto
  });

  it('insere no ramo else de um if', () => {
    const { prog, ifNode } = sample();
    const next = insertStatement(
      prog,
      { branchPath: [{ parentId: ifNode.id, field: 'else' }], index: 0 },
      output('"novo"'),
    );
    const nextIf = next.statements.find((s) => s.id === ifNode.id) as IfStatement;
    expect(nextIf.elseBranch.length).toBe(2);
    expect(ifNode.elseBranch.length).toBe(1);
  });

  it('insere no corpo de um while', () => {
    const { prog, whileNode } = sample();
    const next = insertStatement(
      prog,
      { branchPath: [{ parentId: whileNode.id, field: 'body' }], index: 1 },
      assign('x', 'x + 2'),
    );
    const nextWhile = next.statements.find((s) => s.id === whileNode.id) as WhileStatement;
    expect(nextWhile.body.length).toBe(2);
    expect(whileNode.body.length).toBe(1);
  });
});

describe('programOps — removeStatement', () => {
  it('remove no nível raiz sem mutar o original', () => {
    const { prog, ifNode } = sample();
    const next = removeStatement(prog, ifNode.id);
    expect(next.statements.find((s) => s.id === ifNode.id)).toBeUndefined();
    expect(prog.statements.find((s) => s.id === ifNode.id)).toBeDefined();
  });

  it('remove um comando do corpo de um while', () => {
    const { prog, whileNode } = sample();
    const inner = whileNode.body[0];
    const next = removeStatement(prog, inner.id);
    const nextWhile = next.statements.find((s) => s.id === whileNode.id) as WhileStatement;
    expect(nextWhile.body.length).toBe(0);
    expect(whileNode.body.length).toBe(1); // original intacto
  });
});

describe('programOps — updateStatement', () => {
  it('aplica patch criando novo objeto e preservando o original', () => {
    const { prog } = sample();
    const target = prog.statements[0] as { id: string };
    const next = updateStatement(prog, target.id, { name: 'y' } as Partial<typeof target>);
    expect((next.statements[0] as { name: string }).name).toBe('y');
    expect((prog.statements[0] as { name: string }).name).toBe('x');
  });

  it('atualiza expressão de um assign aninhado no then', () => {
    const { prog, ifNode } = sample();
    const inner = ifNode.thenBranch[0] as AssignStatement;
    const next = updateStatement(prog, inner.id, { expression: '99' } as Partial<AssignStatement>);
    const nextIf = next.statements.find((s) => s.id === ifNode.id) as IfStatement;
    expect((nextIf.thenBranch[0] as AssignStatement).expression).toBe('99');
    expect(inner.expression).toBe('1'); // original intacto
  });
});

describe('programOps — findStatement', () => {
  it('encontra comando no nível raiz', () => {
    const { prog, whileNode } = sample();
    expect(findStatement(prog, whileNode.id)?.id).toBe(whileNode.id);
  });

  it('encontra comando aninhado em then/else/body', () => {
    const { prog, ifNode, whileNode } = sample();
    expect(findStatement(prog, ifNode.thenBranch[0].id)?.id).toBe(ifNode.thenBranch[0].id);
    expect(findStatement(prog, ifNode.elseBranch[0].id)?.id).toBe(ifNode.elseBranch[0].id);
    expect(findStatement(prog, whileNode.body[0].id)?.id).toBe(whileNode.body[0].id);
  });

  it('retorna null para id inexistente', () => {
    const { prog } = sample();
    expect(findStatement(prog, 'inexistente')).toBeNull();
  });
});
