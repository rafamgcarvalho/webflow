import type { NodeTypes } from '@xyflow/react';
import TerminalNode from './TerminalNode';
import ProcessNode from './ProcessNode';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import DeclareNode from './DeclareNode';
import IfNode from './IfNode';
import WhileNode from './WhileNode';
import JoinNode from './JoinNode';

export const nodeTypes: NodeTypes = {
  terminal: TerminalNode,
  // Os types dos statements seguem a propriedade `kind`
  assign: ProcessNode,
  input: InputNode,
  output: OutputNode,
  declare: DeclareNode,
  if: IfNode,
  while: WhileNode,
  join: JoinNode,
};
