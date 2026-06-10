import type { FlowProgram, Statement, VarType } from '../types/flow';
import {
  evaluateExpression,
  ExpressionError,
  type RuntimeValue,
} from './expression';

export interface VariableInfo {
  name: string;
  type: VarType;
  value: RuntimeValue | undefined;
}

export interface RunnerCallbacks {
  onOutput: (text: string, newline: boolean) => void;
  onInput: (variableName: string) => Promise<string>;
  onVariables: (variables: VariableInfo[]) => void;
  onActiveStatement?: (id: string | null) => void;
  onError?: (message: string) => void;
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export interface RunOptions {
  /** Atraso fixo (ms) antes de cada comando. Padrão de produção: 120. Use 0 nos testes. */
  stepDelayMs?: number;
  /** Limite de iterações por laço `while` antes de abortar (guarda contra laço infinito). */
  maxIterations?: number;
}

const DEFAULT_STEP_DELAY_MS = 120;
const DEFAULT_MAX_ITERATIONS = 100_000;

interface ResolvedRunOptions {
  stepDelayMs: number;
  maxIterations: number;
}

interface Scope {
  vars: Map<string, VariableInfo>;
}

function emitVars(scope: Scope, cb: RunnerCallbacks) {
  cb.onVariables(Array.from(scope.vars.values()));
}

function lookup(scope: Scope, name: string): RuntimeValue {
  const lower = name.toLowerCase();
  for (const v of scope.vars.values()) {
    if (v.name.toLowerCase() === lower) {
      if (v.value === undefined) {
        throw new RuntimeError(`Variável '${name}' não inicializada.`);
      }
      return v.value;
    }
  }
  throw new RuntimeError(`Variável '${name}' não declarada.`);
}

function setVar(scope: Scope, name: string, value: RuntimeValue) {
  const lower = name.toLowerCase();
  for (const v of scope.vars.values()) {
    if (v.name.toLowerCase() === lower) {
      v.value = coerce(value, v.type, name);
      return;
    }
  }
  throw new RuntimeError(`Variável '${name}' não declarada.`);
}

function coerce(value: RuntimeValue, varType: VarType, name: string): RuntimeValue {
  switch (varType) {
    case 'Integer':
      if (typeof value === 'number') return Math.trunc(value);
      if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return parseInt(value, 10);
      throw new RuntimeError(`Valor inválido para Integer em '${name}': ${formatValue(value)}`);
    case 'Real':
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) return parseFloat(value);
      throw new RuntimeError(`Valor inválido para Real em '${name}': ${formatValue(value)}`);
    case 'String':
      return String(value);
    case 'Boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower === 'true' || lower === 'verdadeiro') return true;
        if (lower === 'false' || lower === 'falso') return false;
      }
      throw new RuntimeError(`Valor inválido para Boolean em '${name}': ${formatValue(value)}`);
  }
}

export function formatValue(value: RuntimeValue | undefined): string {
  if (value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'verdadeiro' : 'falso';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  return value;
}

function evalExpr(source: string, scope: Scope): RuntimeValue {
  try {
    return evaluateExpression(source, (name) => lookup(scope, name));
  } catch (err) {
    if (err instanceof ExpressionError) {
      throw new RuntimeError(`Erro na expressão "${source}": ${err.message}`);
    }
    throw err;
  }
}

async function execStatements(
  statements: Statement[],
  scope: Scope,
  cb: RunnerCallbacks,
  signal: AbortSignal,
  opts: ResolvedRunOptions,
): Promise<void> {
  for (const stmt of statements) {
    if (signal.aborted) throw new RuntimeError('Execução interrompida.');
    cb.onActiveStatement?.(stmt.id);
    if (opts.stepDelayMs > 0) await sleep(opts.stepDelayMs, signal);
    await execStatement(stmt, scope, cb, signal, opts);
  }
}

async function execStatement(
  stmt: Statement,
  scope: Scope,
  cb: RunnerCallbacks,
  signal: AbortSignal,
  opts: ResolvedRunOptions,
): Promise<void> {
  switch (stmt.kind) {
    case 'declare': {
      if (scope.vars.has(stmt.name.toLowerCase())) {
        throw new RuntimeError(`Variável '${stmt.name}' já declarada.`);
      }
      scope.vars.set(stmt.name.toLowerCase(), {
        name: stmt.name,
        type: stmt.varType,
        value: undefined,
      });
      emitVars(scope, cb);
      return;
    }
    case 'assign': {
      const value = evalExpr(stmt.expression, scope);
      setVar(scope, stmt.variable, value);
      emitVars(scope, cb);
      return;
    }
    case 'input': {
      const text = await raceAbort(cb.onInput(stmt.variable), signal);
      const lower = stmt.variable.toLowerCase();
      const info = scope.vars.get(lower);
      if (!info) throw new RuntimeError(`Variável '${stmt.variable}' não declarada.`);
      setVar(scope, stmt.variable, text);
      emitVars(scope, cb);
      return;
    }
    case 'output': {
      const value = evalExpr(stmt.expression, scope);
      cb.onOutput(formatValue(value), stmt.newline);
      return;
    }
    case 'if': {
      const cond = evalExpr(stmt.condition, scope);
      if (toBool(cond)) {
        await execStatements(stmt.thenBranch, scope, cb, signal, opts);
      } else {
        await execStatements(stmt.elseBranch, scope, cb, signal, opts);
      }
      return;
    }
    case 'while': {
      // Guarda contra laço infinito: corta após N iterações pra não travar a aba.
      let iterations = 0;
      const MAX_ITERATIONS = opts.maxIterations;
      while (true) {
        if (signal.aborted) throw new RuntimeError('Execução interrompida.');
        const cond = evalExpr(stmt.condition, scope);
        if (!toBool(cond)) break;
        iterations++;
        if (iterations > MAX_ITERATIONS) {
          throw new RuntimeError(
            `Loop ultrapassou ${MAX_ITERATIONS} iterações — possível laço infinito.`,
          );
        }
        await execStatements(stmt.body, scope, cb, signal, opts);
      }
      return;
    }
  }
}

function toBool(value: RuntimeValue): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return value.length > 0;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new RuntimeError('Execução interrompida.'));
    }, { once: true });
  });
}

function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new RuntimeError('Execução interrompida.'));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new RuntimeError('Execução interrompida.'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
      (err) => { signal.removeEventListener('abort', onAbort); reject(err); },
    );
  });
}

export interface RunController {
  abort: () => void;
  promise: Promise<void>;
}

export function runProgram(
  program: FlowProgram,
  cb: RunnerCallbacks,
  options: RunOptions = {},
): RunController {
  const opts: ResolvedRunOptions = {
    stepDelayMs: options.stepDelayMs ?? DEFAULT_STEP_DELAY_MS,
    maxIterations: options.maxIterations ?? DEFAULT_MAX_ITERATIONS,
  };
  const scope: Scope = { vars: new Map() };
  const controller = new AbortController();
  const promise = (async () => {
    try {
      emitVars(scope, cb);
      await execStatements(program.statements, scope, cb, controller.signal, opts);
      cb.onActiveStatement?.(null);
    } catch (err) {
      cb.onActiveStatement?.(null);
      const msg = err instanceof Error ? err.message : String(err);
      cb.onError?.(msg);
    }
  })();
  return {
    abort: () => controller.abort(),
    promise,
  };
}
