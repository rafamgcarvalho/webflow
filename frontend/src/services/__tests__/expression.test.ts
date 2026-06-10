import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  ExpressionError,
  type RuntimeValue,
} from '../expression';

// Lookup vazio: qualquer variável referenciada falha (expressões puramente constantes).
const noVars = (name: string): RuntimeValue => {
  throw new ExpressionError(`Variável '${name}' não declarada.`);
};

// Lookup case-insensitive a partir de um mapa (como faz o interpretador).
function lookupFrom(vars: Record<string, RuntimeValue>) {
  const lower = new Map(
    Object.entries(vars).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return (name: string): RuntimeValue => {
    const v = lower.get(name.toLowerCase());
    if (v === undefined) throw new ExpressionError(`Variável '${name}' não declarada.`);
    return v;
  };
}

const evalC = (src: string) => evaluateExpression(src, noVars);

describe('expression — aritmética e precedência', () => {
  it('multiplicação antes de soma: 2 + 3 * 4 = 14', () => {
    expect(evalC('2 + 3 * 4')).toBe(14);
  });

  it('parênteses alteram precedência: (2 + 3) * 4 = 20', () => {
    expect(evalC('(2 + 3) * 4')).toBe(20);
  });

  it('potência é associativa à direita: 2 ^ 3 ^ 2 = 512', () => {
    expect(evalC('2 ^ 3 ^ 2')).toBe(512);
  });

  it('divisão produz real: 10 / 4 = 2.5', () => {
    expect(evalC('10 / 4')).toBe(2.5);
  });

  it('módulo com %: 7 % 3 = 1', () => {
    expect(evalC('7 % 3')).toBe(1);
  });
});

describe('expression — operadores do Flowgorithm', () => {
  it('mod textual: 7 mod 3 = 1', () => {
    expect(evalC('7 mod 3')).toBe(1);
  });

  it('diferente com <>: 5 <> 4 = verdadeiro', () => {
    expect(evalC('5 <> 4')).toBe(true);
  });

  it('igualdade com =: 3 = 3 = verdadeiro', () => {
    expect(evalC('3 = 3')).toBe(true);
    expect(evalC('3 = 4')).toBe(false);
  });

  it('concatenação com &: "a" & "b" = "ab"', () => {
    expect(evalC('"a" & "b"')).toBe('ab');
  });
});

describe('expression — booleanos e lógicos', () => {
  it('true and false = falso', () => {
    expect(evalC('true and false')).toBe(false);
  });

  it('not (1 > 2) = verdadeiro', () => {
    expect(evalC('not (1 > 2)')).toBe(true);
  });

  it('1 < 2 or 5 < 3 = verdadeiro', () => {
    expect(evalC('1 < 2 or 5 < 3')).toBe(true);
  });

  it('equivalência entre palavras e símbolos', () => {
    expect(evalC('true and false')).toBe(evalC('true && false'));
    expect(evalC('1 < 2 or 5 < 3')).toBe(evalC('1 < 2 || 5 < 3'));
    expect(evalC('not (1 > 2)')).toBe(evalC('!(1 > 2)'));
  });
});

describe('expression — unários e parênteses', () => {
  it('-5 + 2 = -3', () => {
    expect(evalC('-5 + 2')).toBe(-3);
  });

  it('!(false) = verdadeiro', () => {
    expect(evalC('!(false)')).toBe(true);
  });
});

describe('expression — resolução de variáveis (case-insensitive)', () => {
  it('resolve variáveis a partir do lookup', () => {
    const lookup = lookupFrom({ x: 5, y: 3 });
    expect(evaluateExpression('x + y', lookup)).toBe(8);
  });

  it('é case-insensitive no nome da variável', () => {
    const lookup = lookupFrom({ Total: 10 });
    expect(evaluateExpression('TOTAL * 2', lookup)).toBe(20);
    expect(evaluateExpression('total * 2', lookup)).toBe(20);
  });
});

describe('expression — erros esperados', () => {
  it('divisão por zero lança ExpressionError', () => {
    expect(() => evalC('1 / 0')).toThrow(ExpressionError);
    expect(() => evalC('1 / 0')).toThrow(/zero/i);
  });

  it('string sem fechamento lança erro', () => {
    expect(() => evalC('"abc')).toThrow(ExpressionError);
  });

  it('caractere inválido lança erro', () => {
    expect(() => evalC('2 @ 3')).toThrow(ExpressionError);
  });
});
