import type { FlowProgram, Statement, VarType } from '../types/flow';

const C_TYPE: Record<VarType, string> = {
  Integer: 'int',
  Real: 'double',
  String: 'char*',
  Boolean: 'int',
};

const PRINTF_FMT: Record<VarType, string> = {
  Integer: '%d',
  Real: '%lf',
  String: '%s',
  Boolean: '%d',
};

const SCANF_FMT: Record<VarType, string> = {
  Integer: '%d',
  Real: '%lf',
  String: '%s',
  Boolean: '%d',
};

interface ExporterContext {
  variables: Map<string, VarType>;
  lines: string[];
  indent: number;
}

function pushLine(ctx: ExporterContext, line: string) {
  ctx.lines.push('    '.repeat(ctx.indent) + line);
}

function inferVarType(ctx: ExporterContext, name: string): VarType {
  return ctx.variables.get(name.toLowerCase()) ?? 'Integer';
}

function expressionToC(expr: string): string {
  let s = expr;

  s = s.replace(/\b(?:AND|and)\b/g, '&&');
  s = s.replace(/\b(?:OR|or)\b/g, '||');
  s = s.replace(/\b(?:NOT|not)\b/g, '!');
  s = s.replace(/\b(?:mod|MOD)\b/g, '%');
  s = s.replace(/\b(?:true|TRUE|verdadeiro)\b/g, '1');
  s = s.replace(/\b(?:false|FALSE|falso)\b/g, '0');

  s = s.replace(/<>/g, '!=');
  s = s.replace(/(^|[^=<>!])=(?!=)/g, '$1==');

  // `^` é XOR em C, mas no Flowgorithm significa potência — converte para pow().
  if (/\^/.test(s)) {
    s = s.replace(
      /([A-Za-z0-9_.()]+)\s*\^\s*([A-Za-z0-9_.()]+)/g,
      'pow($1, $2)',
    );
  }

  return s;
}

function emitStatement(stmt: Statement, ctx: ExporterContext) {
  switch (stmt.kind) {
    case 'declare': {
      ctx.variables.set(stmt.name.toLowerCase(), stmt.varType);
      if (stmt.varType === 'String') {
        pushLine(ctx, `char ${stmt.name}[256];`);
      } else {
        pushLine(ctx, `${C_TYPE[stmt.varType]} ${stmt.name};`);
      }
      return;
    }
    case 'assign': {
      const expr = expressionToC(stmt.expression);
      const type = inferVarType(ctx, stmt.variable);
      if (type === 'String') {
        pushLine(ctx, `strcpy(${stmt.variable}, ${expr});`);
      } else {
        pushLine(ctx, `${stmt.variable} = ${expr};`);
      }
      return;
    }
    case 'input': {
      const type = inferVarType(ctx, stmt.variable);
      const fmt = SCANF_FMT[type];
      if (type === 'String') {
        pushLine(ctx, `scanf("${fmt}", ${stmt.variable});`);
      } else {
        pushLine(ctx, `scanf("${fmt}", &${stmt.variable});`);
      }
      return;
    }
    case 'output': {
      const expr = stmt.expression.trim();
      const newline = stmt.newline ? '\\n' : '';
      const literalMatch = /^"((?:[^"\\]|\\.)*)"$/.exec(expr);
      if (literalMatch) {
        pushLine(ctx, `printf("${literalMatch[1]}${newline}");`);
        return;
      }
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) {
        const type = inferVarType(ctx, expr);
        pushLine(ctx, `printf("${PRINTF_FMT[type]}${newline}", ${expr});`);
        return;
      }
      pushLine(ctx, `printf("%g${newline}", (double)(${expressionToC(expr)}));`);
      return;
    }
    case 'if': {
      pushLine(ctx, `if (${expressionToC(stmt.condition)}) {`);
      ctx.indent++;
      stmt.thenBranch.forEach((s) => emitStatement(s, ctx));
      ctx.indent--;
      if (stmt.elseBranch.length > 0) {
        pushLine(ctx, '} else {');
        ctx.indent++;
        stmt.elseBranch.forEach((s) => emitStatement(s, ctx));
        ctx.indent--;
      }
      pushLine(ctx, '}');
      return;
    }
    case 'while': {
      pushLine(ctx, `while (${expressionToC(stmt.condition)}) {`);
      ctx.indent++;
      stmt.body.forEach((s) => emitStatement(s, ctx));
      ctx.indent--;
      pushLine(ctx, '}');
      return;
    }
  }
}

export function exportToC(program: FlowProgram): string {
  const ctx: ExporterContext = {
    variables: new Map(),
    lines: [],
    indent: 1,
  };

  program.statements.forEach((s) => emitStatement(s, ctx));

  const header = [
    '#include <stdio.h>',
    '#include <string.h>',
    '#include <math.h>',
    '',
    `/* Programa: ${program.name} */`,
    'int main(void) {',
    '    /* Desabilita o buffer do stdout pra que prompts e saídas',
    '       apareçam imediatamente, igual ao console do WebFlow. */',
    '    setbuf(stdout, NULL);',
    '',
  ];
  const footer = [
    '    return 0;',
    '}',
    '',
  ];

  return [...header, ...ctx.lines, ...footer].join('\n');
}
