// @vitest-environment jsdom
// Este módulo usa DOMParser / File / FileReader (APIs de navegador), então roda sob jsdom.
import { describe, it, expect } from 'vitest';
import { importFprgFile } from '../fprgParser';
import type { IfStatement } from '../../types/flow';

const FPRG = `<?xml version="1.0"?>
<flowgorithm>
  <attributes>
    <attribute name="name" value="Exemplo"/>
  </attributes>
  <function name="Main" type="None" variable="">
    <body>
      <declare name="n" type="Integer" array="False"/>
      <assign variable="n" expression="7"/>
      <output expression="n" newline="True"/>
      <if expression="n &gt; 0">
        <then>
          <output expression="&quot;positivo&quot;" newline="True"/>
        </then>
        <else></else>
      </if>
    </body>
  </function>
</flowgorithm>`;

describe('fprgParser — round-trip XML → AST', () => {
  it('importa um .fprg e produz o FlowProgram esperado', async () => {
    const file = new File([FPRG], 'exemplo.fprg', { type: 'text/xml' });
    const prog = await importFprgFile(file);

    expect(prog.name).toBe('Exemplo');
    expect(prog.statements.map((s) => s.kind)).toEqual([
      'declare',
      'assign',
      'output',
      'if',
    ]);

    const ifNode = prog.statements[3] as IfStatement;
    // entidades XML são decodificadas (&gt; → >, &quot; → ")
    expect(ifNode.condition).toBe('n > 0');
    expect(ifNode.thenBranch[0]).toMatchObject({
      kind: 'output',
      expression: '"positivo"',
    });
    expect(ifNode.elseBranch).toEqual([]);
  });

  it('rejeita XML mal formado', async () => {
    const bad = new File(['<flowgorithm><function></flowgorithm>'], 'x.fprg', {
      type: 'text/xml',
    });
    await expect(importFprgFile(bad)).rejects.toThrow();
  });
});
