import type {
  FlowProgram,
  Statement,
  VarType,
} from '../types/flow';
import { newId } from '../types/flow';

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}

function normalizeVarType(raw: string): VarType {
  switch (raw.toLowerCase()) {
    case 'integer': return 'Integer';
    case 'real': return 'Real';
    case 'string': return 'String';
    case 'boolean': return 'Boolean';
    default: return 'Integer';
  }
}

function readFprgFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsText(file, 'UTF-8');
  });
}

function parseStatements(parent: Element): Statement[] {
  const out: Statement[] = [];

  for (const el of Array.from(parent.children)) {
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'declare': {
        // Flowgorithm aceita "a, b, c" num único <declare>; geramos um statement por variável.
        const rawName = el.getAttribute('name') || 'x';
        const varType = normalizeVarType(el.getAttribute('type') || 'Integer');
        const names = rawName
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const name of names) {
          out.push({
            id: newId('decl'),
            kind: 'declare',
            name,
            varType,
          });
        }
        break;
      }
      case 'assign': {
        out.push({
          id: newId('asg'),
          kind: 'assign',
          variable: el.getAttribute('variable') || '',
          expression: decodeXmlEntities(el.getAttribute('expression') || ''),
        });
        break;
      }
      case 'input': {
        out.push({
          id: newId('in'),
          kind: 'input',
          variable: el.getAttribute('variable') || '',
        });
        break;
      }
      case 'output': {
        out.push({
          id: newId('out'),
          kind: 'output',
          expression: decodeXmlEntities(el.getAttribute('expression') || ''),
          newline: el.getAttribute('newline') !== 'False',
        });
        break;
      }
      case 'if': {
        const condition = decodeXmlEntities(el.getAttribute('expression') || 'true');
        const thenEl = el.querySelector(':scope > then');
        const elseEl = el.querySelector(':scope > else');
        out.push({
          id: newId('if'),
          kind: 'if',
          condition,
          thenBranch: thenEl ? parseStatements(thenEl) : [],
          elseBranch: elseEl ? parseStatements(elseEl) : [],
        });
        break;
      }
      case 'while': {
        const condition = decodeXmlEntities(el.getAttribute('expression') || 'true');
        out.push({
          id: newId('wh'),
          kind: 'while',
          condition,
          body: parseStatements(el),
        });
        break;
      }
      default:
        console.warn(`[Parser] Tag não suportada: <${tag}>`);
    }
  }

  return out;
}

function parseFprgXml(xmlContent: string): FlowProgram {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Arquivo .fprg inválido (XML mal formado).');
  }

  let name = 'Sem título';
  const attrs = doc.querySelectorAll('attributes > attribute');
  attrs.forEach((a) => {
    if (a.getAttribute('name') === 'name') {
      name = a.getAttribute('value') || name;
    }
  });

  const functions = Array.from(doc.querySelectorAll('function'));
  const main = functions.find(
    (f) => (f.getAttribute('name') || '').toLowerCase() === 'main',
  ) ?? functions[0];

  if (!main) throw new Error('Nenhuma função encontrada no arquivo.');
  const body = main.querySelector(':scope > body');
  if (!body) throw new Error('Função sem corpo (<body>).');

  return {
    name,
    statements: parseStatements(body),
  };
}

export async function importFprgFile(file: File): Promise<FlowProgram> {
  const xml = await readFprgFile(file);
  return parseFprgXml(xml);
}
