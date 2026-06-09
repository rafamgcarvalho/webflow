// Avaliador de expressões para o interpretador.
// Sintaxe: literais (num/str/bool), variáveis, + - * / % ^, & (concat),
// == != < <= > >=, && || !, AND OR NOT, mod, ( ).

export type RuntimeValue = number | string | boolean;

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionError';
  }
}

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENT'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }

    // Número
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(input[i + 1] || ''))) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      tokens.push({ type: 'NUMBER', value: input.slice(i, j), pos: i });
      i = j;
      continue;
    }

    // String
    if (c === '"') {
      let j = i + 1;
      let value = '';
      while (j < input.length && input[j] !== '"') {
        if (input[j] === '\\' && j + 1 < input.length) {
          const next = input[j + 1];
          value += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          j += 2;
        } else {
          value += input[j];
          j++;
        }
      }
      if (j >= input.length) {
        throw new ExpressionError('String sem fechamento (")');
      }
      tokens.push({ type: 'STRING', value, pos: i });
      i = j + 1;
      continue;
    }

    // Identificador / palavra-chave
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++;
      const word = input.slice(i, j);
      const lower = word.toLowerCase();
      if (lower === 'and') tokens.push({ type: 'OP', value: '&&', pos: i });
      else if (lower === 'or') tokens.push({ type: 'OP', value: '||', pos: i });
      else if (lower === 'not') tokens.push({ type: 'OP', value: '!', pos: i });
      else if (lower === 'mod') tokens.push({ type: 'OP', value: '%', pos: i });
      else tokens.push({ type: 'IDENT', value: word, pos: i });
      i = j;
      continue;
    }

    // Parênteses
    if (c === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i });
      i++;
      continue;
    }

    // Operadores multi-caractere
    const two = input.slice(i, i + 2);
    if (two === '==' || two === '!=' || two === '<=' || two === '>=' || two === '&&' || two === '||' || two === '<>') {
      tokens.push({ type: 'OP', value: two === '<>' ? '!=' : two, pos: i });
      i += 2;
      continue;
    }

    if ('+-*/%^<>!&='.includes(c)) {
      // '=' isolado é tratado como '=='
      tokens.push({ type: 'OP', value: c === '=' ? '==' : c, pos: i });
      i++;
      continue;
    }

    throw new ExpressionError(`Caractere inválido em expressão: '${c}'`);
  }

  tokens.push({ type: 'EOF', value: '', pos: input.length });
  return tokens;
}

type VarLookup = (name: string) => RuntimeValue;

interface ParseState {
  tokens: Token[];
  pos: number;
}

const PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3, '!=': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4,
  '&': 5,
  '+': 6, '-': 6,
  '*': 7, '/': 7, '%': 7,
  '^': 8,
};

function peek(state: ParseState): Token {
  return state.tokens[state.pos];
}

function advance(state: ParseState): Token {
  return state.tokens[state.pos++];
}

function parsePrimary(state: ParseState, lookup: VarLookup): RuntimeValue {
  const tok = advance(state);

  if (tok.type === 'NUMBER') {
    return Number(tok.value);
  }
  if (tok.type === 'STRING') {
    return tok.value;
  }
  if (tok.type === 'IDENT') {
    const lower = tok.value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return lookup(tok.value);
  }
  if (tok.type === 'LPAREN') {
    const value = parseExpr(state, lookup, 0);
    const closing = advance(state);
    if (closing.type !== 'RPAREN') {
      throw new ExpressionError("Esperado ')'");
    }
    return value;
  }
  if (tok.type === 'OP' && (tok.value === '-' || tok.value === '+' || tok.value === '!')) {
    const operand = parsePrimary(state, lookup);
    if (tok.value === '-') {
      if (typeof operand !== 'number') throw new ExpressionError('Operador "-" requer número.');
      return -operand;
    }
    if (tok.value === '+') {
      if (typeof operand !== 'number') throw new ExpressionError('Operador "+" requer número.');
      return +operand;
    }
    if (tok.value === '!') {
      return !toBoolean(operand);
    }
  }
  throw new ExpressionError(`Token inesperado: '${tok.value || tok.type}'`);
}

function parseExpr(state: ParseState, lookup: VarLookup, minPrec: number): RuntimeValue {
  let left = parsePrimary(state, lookup);

  while (true) {
    const tok = peek(state);
    if (tok.type !== 'OP') break;
    const prec = PRECEDENCE[tok.value];
    if (prec === undefined || prec < minPrec) break;
    advance(state);
    // ^ é associativo à direita; demais à esquerda
    const nextMin = tok.value === '^' ? prec : prec + 1;
    const right = parseExpr(state, lookup, nextMin);
    left = applyOp(tok.value, left, right);
  }

  return left;
}

function applyOp(op: string, a: RuntimeValue, b: RuntimeValue): RuntimeValue {
  switch (op) {
    case '+':
      if (typeof a === 'string' || typeof b === 'string') return String(a) + String(b);
      return Number(a) + Number(b);
    case '-': return Number(a) - Number(b);
    case '*': return Number(a) * Number(b);
    case '/': {
      const r = Number(a) / Number(b);
      if (!isFinite(r)) throw new ExpressionError('Divisão por zero.');
      return r;
    }
    case '%': return Number(a) % Number(b);
    case '^': return Math.pow(Number(a), Number(b));
    case '&': return String(a) + String(b);
    case '==': return a === b;
    case '!=': return a !== b;
    case '<': return (a as number | string) < (b as number | string);
    case '<=': return (a as number | string) <= (b as number | string);
    case '>': return (a as number | string) > (b as number | string);
    case '>=': return (a as number | string) >= (b as number | string);
    case '&&': return toBoolean(a) && toBoolean(b);
    case '||': return toBoolean(a) || toBoolean(b);
    default: throw new ExpressionError(`Operador desconhecido: ${op}`);
  }
}

function toBoolean(v: RuntimeValue): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return v.length > 0;
}

export function evaluateExpression(
  source: string,
  lookup: VarLookup,
): RuntimeValue {
  const tokens = tokenize(source);
  const state: ParseState = { tokens, pos: 0 };
  const value = parseExpr(state, lookup, 0);
  if (peek(state).type !== 'EOF') {
    throw new ExpressionError('Tokens sobrando ao fim da expressão.');
  }
  return value;
}
