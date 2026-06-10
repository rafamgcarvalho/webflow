import { describe, it, expect } from 'vitest';
import { runProgram, type RunOptions, type VariableInfo } from '../interpreter';
import type { FlowProgram } from '../../types/flow';
import {
  declare,
  assign,
  input,
  output,
  ifStmt,
  whileStmt,
  program,
} from './astBuilders';

interface RunResult {
  outputs: string[];      // saídas, uma por chamada de onOutput (sem o '\n')
  text: string;           // concatenação respeitando newline
  vars: VariableInfo[];   // último snapshot de variáveis
  error: string | null;
}

// Executa um programa com atraso 0 (injeção via RunOptions) e coleta os efeitos.
async function run(
  prog: FlowProgram,
  inputs: string[] = [],
  options: RunOptions = {},
): Promise<RunResult> {
  const outputs: string[] = [];
  const parts: string[] = [];
  let vars: VariableInfo[] = [];
  let error: string | null = null;
  const queue = [...inputs];

  const ctrl = runProgram(
    prog,
    {
      onOutput: (text, newline) => {
        outputs.push(text);
        parts.push(text + (newline ? '\n' : ''));
      },
      onInput: async () => {
        if (queue.length === 0) throw new Error('Fila de entradas vazia no teste.');
        return queue.shift()!;
      },
      onVariables: (v) => { vars = v; },
      onError: (msg) => { error = msg; },
    },
    { stepDelayMs: 0, ...options },
  );

  await ctrl.promise;
  return { outputs, text: parts.join(''), vars, error };
}

function varValue(result: RunResult, name: string) {
  return result.vars.find((v) => v.name.toLowerCase() === name.toLowerCase())?.value;
}

describe('interpreter — atraso injetável', () => {
  it('com stepDelayMs=0 executa rápido (sem o sleep de produção)', async () => {
    const prog = program([declare('x', 'Integer'), assign('x', '1'), output('x')]);
    const start = Date.now();
    const res = await run(prog);
    expect(res.error).toBeNull();
    expect(Date.now() - start).toBeLessThan(100); // muito abaixo do 120ms/comando padrão
  });
});

describe('interpreter — fluxogramas da avaliação de corretude (Tabela 3)', () => {
  it('par ou ímpar: 7 → "Impar"', async () => {
    const prog = program([
      declare('n', 'Integer'),
      input('n'),
      ifStmt('n mod 2 = 0', [output('"Par"')], [output('"Impar"')]),
    ]);
    const res = await run(prog, ['7']);
    expect(res.error).toBeNull();
    expect(res.outputs).toEqual(['Impar']);
  });

  it('par ou ímpar: 10 → "Par"', async () => {
    const prog = program([
      declare('n', 'Integer'),
      input('n'),
      ifStmt('n mod 2 = 0', [output('"Par"')], [output('"Impar"')]),
    ]);
    const res = await run(prog, ['10']);
    expect(res.outputs).toEqual(['Par']);
  });

  it('maior de três (if aninhado): (3, 9, 5) → 9', async () => {
    const prog = program([
      declare('a', 'Integer'),
      declare('b', 'Integer'),
      declare('c', 'Integer'),
      input('a'),
      input('b'),
      input('c'),
      ifStmt(
        'a >= b and a >= c',
        [output('a')],
        [ifStmt('b >= c', [output('b')], [output('c')])],
      ),
    ]);
    const res = await run(prog, ['3', '9', '5']);
    expect(res.error).toBeNull();
    expect(res.outputs).toEqual(['9']);
  });

  it('soma de 1 a N (while + acumulador): N=100 → 5050', async () => {
    const prog = program([
      declare('n', 'Integer'),
      declare('i', 'Integer'),
      declare('soma', 'Integer'),
      input('n'),
      assign('i', '1'),
      assign('soma', '0'),
      whileStmt('i <= n', [
        assign('soma', 'soma + i'),
        assign('i', 'i + 1'),
      ]),
      output('soma'),
    ]);
    const res = await run(prog, ['100']);
    expect(res.error).toBeNull();
    expect(res.outputs).toEqual(['5050']);
    expect(varValue(res, 'soma')).toBe(5050);
  });

  it('fatorial (while + produto): N=5 → 120', async () => {
    const prog = program([
      declare('n', 'Integer'),
      declare('f', 'Integer'),
      declare('i', 'Integer'),
      input('n'),
      assign('f', '1'),
      assign('i', '1'),
      whileStmt('i <= n', [
        assign('f', 'f * i'),
        assign('i', 'i + 1'),
      ]),
      output('f'),
    ]);
    const res = await run(prog, ['5']);
    expect(res.outputs).toEqual(['120']);
  });

  it('tabuada (while + saída repetida): N=3 → 3,6,...,30', async () => {
    const prog = program([
      declare('n', 'Integer'),
      declare('i', 'Integer'),
      input('n'),
      assign('i', '1'),
      whileStmt('i <= 10', [
        output('n * i'),
        assign('i', 'i + 1'),
      ]),
    ]);
    const res = await run(prog, ['3']);
    expect(res.error).toBeNull();
    expect(res.outputs).toEqual(['3', '6', '9', '12', '15', '18', '21', '24', '27', '30']);
  });

  it('Celsius→Fahrenheit (tipo Real): 25 → 77', async () => {
    const prog = program([
      declare('c', 'Real'),
      declare('f', 'Real'),
      input('c'),
      assign('f', 'c * 9 / 5 + 32'),
      output('f'),
    ]);
    const res = await run(prog, ['25']);
    expect(res.error).toBeNull();
    expect(res.outputs).toEqual(['77']);
  });

  it('saudação (String + & + input): "Rafael" → "Olá, Rafael"', async () => {
    const prog = program([
      declare('nome', 'String'),
      declare('msg', 'String'),
      input('nome'),
      assign('msg', '"Olá, " & nome'),
      output('msg'),
    ]);
    const res = await run(prog, ['Rafael']);
    expect(res.outputs).toEqual(['Olá, Rafael']);
  });
});

describe('interpreter — erros de execução', () => {
  it('variável não declarada reporta erro via onError', async () => {
    const prog = program([assign('x', '1')]);
    const res = await run(prog);
    expect(res.error).not.toBeNull();
    expect(res.error).toMatch(/não declarada/i);
  });

  it('redeclaração reporta erro', async () => {
    const prog = program([declare('x', 'Integer'), declare('x', 'Integer')]);
    const res = await run(prog);
    expect(res.error).toMatch(/já declarada/i);
  });

  it('proteção contra laço infinito aborta após o limite de iterações', async () => {
    const prog = program([
      declare('i', 'Integer'),
      assign('i', '1'),
      whileStmt('1 < 2', [assign('i', 'i + 1')]),
    ]);
    const res = await run(prog, [], { maxIterations: 50 });
    expect(res.error).not.toBeNull();
    expect(res.error).toMatch(/itera/i);
  });
});
