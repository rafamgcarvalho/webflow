import type { FlowProgram, Statement } from '../types/flow';

function escapeXmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function indent(level: number): string {
  return '    '.repeat(level);
}

function emitStatements(statements: Statement[], depth: number): string {
  return statements.map((s) => emitStatement(s, depth)).join('');
}

function emitStatement(stmt: Statement, depth: number): string {
  const pad = indent(depth);
  switch (stmt.kind) {
    case 'declare':
      return `${pad}<declare name="${escapeXmlAttr(stmt.name)}" type="${stmt.varType}" array="False" size=""/>\n`;
    case 'assign':
      return `${pad}<assign variable="${escapeXmlAttr(stmt.variable)}" expression="${escapeXmlAttr(stmt.expression)}"/>\n`;
    case 'input':
      return `${pad}<input variable="${escapeXmlAttr(stmt.variable)}"/>\n`;
    case 'output':
      return `${pad}<output expression="${escapeXmlAttr(stmt.expression)}" newline="${stmt.newline ? 'True' : 'False'}"/>\n`;
    case 'if': {
      const head = `${pad}<if expression="${escapeXmlAttr(stmt.condition)}">\n`;
      const thenBlock = `${indent(depth + 1)}<then>\n${emitStatements(stmt.thenBranch, depth + 2)}${indent(depth + 1)}</then>\n`;
      const elseBlock = `${indent(depth + 1)}<else>\n${emitStatements(stmt.elseBranch, depth + 2)}${indent(depth + 1)}</else>\n`;
      return head + thenBlock + elseBlock + `${pad}</if>\n`;
    }
    case 'while': {
      const head = `${pad}<while expression="${escapeXmlAttr(stmt.condition)}">\n`;
      return head + emitStatements(stmt.body, depth + 1) + `${pad}</while>\n`;
    }
  }
}

export function exportToFprg(program: FlowProgram, authorName = ''): string {
  const name = program.name && program.name.trim().length > 0 ? program.name : 'SemTitulo';
  const body = emitStatements(program.statements, 3);

  return [
    '<?xml version="1.0"?>',
    '<flowgorithm fileversion="4.2">',
    '    <attributes>',
    `        <attribute name="name" value="${escapeXmlAttr(name)}"/>`,
    `        <attribute name="authors" value="${escapeXmlAttr(authorName)}"/>`,
    '        <attribute name="about" value=""/>',
    '        <attribute name="saved" value=""/>',
    '        <attribute name="created" value=""/>',
    '        <attribute name="edited" value=""/>',
    '    </attributes>',
    '    <function name="Main" type="None" variable="">',
    '        <parameters/>',
    '        <body>',
    body,
    '        </body>',
    '    </function>',
    '</flowgorithm>',
    '',
  ].join('\n');
}
