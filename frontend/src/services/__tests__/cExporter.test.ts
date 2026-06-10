import { describe, it, expect } from 'vitest';
import { exportToC } from '../cExporter';
import {
  declare,
  assign,
  input,
  output,
  ifStmt,
  whileStmt,
  program,
} from './astBuilders';

describe('cExporter — tradução de operadores', () => {
  it('mod → %', () => {
    const c = exportToC(program([declare('x', 'Integer'), assign('x', '7 mod 3')]));
    expect(c).toContain('x = 7 % 3;');
  });

  it('<> → !=', () => {
    const c = exportToC(program([ifStmt('a <> b', [output('"x"')])]));
    expect(c).toContain('if (a != b) {');
  });

  it('= → ==', () => {
    const c = exportToC(program([ifStmt('a = b', [output('"x"')])]));
    expect(c).toContain('a == b');
  });

  it('a ^ b → pow(a, b)', () => {
    const c = exportToC(program([declare('r', 'Integer'), assign('r', 'a ^ b')]));
    expect(c).toContain('pow(a, b)');
  });

  it('and/or/not → &&/||/!', () => {
    const c = exportToC(program([ifStmt('a and b or not c', [output('"x"')])]));
    expect(c).toContain('&&');
    expect(c).toContain('||');
    expect(c).toContain('!');
  });
});

describe('cExporter — emissão por tipo de bloco', () => {
  it('declare emite int / double / char[]', () => {
    const c = exportToC(program([
      declare('i', 'Integer'),
      declare('r', 'Real'),
      declare('s', 'String'),
    ]));
    expect(c).toContain('int i;');
    expect(c).toContain('double r;');
    expect(c).toContain('char s[256];');
  });

  it('assign usa strcpy para String e atribuição direta para numéricos', () => {
    const c = exportToC(program([
      declare('s', 'String'),
      declare('n', 'Integer'),
      assign('s', '"oi"'),
      assign('n', '1 + 2'),
    ]));
    expect(c).toContain('strcpy(s, "oi");');
    expect(c).toContain('n = 1 + 2;');
  });

  it('input usa scanf com & para numéricos e sem & para String', () => {
    const c = exportToC(program([
      declare('n', 'Integer'),
      declare('s', 'String'),
      input('n'),
      input('s'),
    ]));
    expect(c).toContain('scanf("%d", &n);');
    expect(c).toContain('scanf("%s", s);');
  });

  it('output trata literal, variável e expressão', () => {
    const c = exportToC(program([
      declare('n', 'Integer'),
      output('"Olá"'),
      output('n'),
      output('n * 2'),
    ]));
    expect(c).toContain('printf("Olá\\n");');
    expect(c).toContain('printf("%d\\n", n);');
    expect(c).toContain('printf("%g\\n", (double)(n * 2));');
  });

  it('if/else e while emitem blocos com indentação', () => {
    const c = exportToC(program([
      declare('i', 'Integer'),
      declare('n', 'Integer'),
      ifStmt('i > 0', [output('"pos"')], [output('"nao pos"')]),
      whileStmt('i <= n', [assign('i', 'i + 1')]),
    ]));
    expect(c).toContain('if (i > 0) {');
    expect(c).toContain('} else {');
    expect(c).toContain('while (i <= n) {');
    // indentação: corpo do main em 1 nível (4 espaços), corpo de bloco em 2 níveis.
    expect(c).toContain('        i = i + 1;');
  });
});

describe('cExporter — estrutura geral', () => {
  it('inclui headers, main e return 0', () => {
    const c = exportToC(program([declare('x', 'Integer')]));
    expect(c).toContain('#include <stdio.h>');
    expect(c).toContain('#include <string.h>');
    expect(c).toContain('#include <math.h>');
    expect(c).toContain('int main(void) {');
    expect(c).toContain('return 0;');
  });
});
