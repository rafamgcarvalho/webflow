import { MarkerType, type Node, type Edge } from '@xyflow/react';
import type { FlowProgram, Statement } from '../types/flow';
import type { BranchStep } from './programOps';

const NODE_W = 220;
const NODE_H = 56;
const DIAMOND_W = 200;
const DIAMOND_H = 80;
const JOIN_SIZE = 14;

// VERT_GAP precisa ≥ ~44 para o "+" (22px) + setas não sobreporem nada.
const VERT_GAP = 50;
const HORZ_GAP = 90;

const ARROW_COLOR = '#64748b';

interface LaidOut {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
  entryId: string | null;
  exitId: string | null;
  exitHandle?: string;
  exitLabel?: string;
}

function statementSize(kind: Statement['kind']): { w: number; h: number } {
  if (kind === 'if' || kind === 'while') return { w: DIAMOND_W, h: DIAMOND_H };
  return { w: NODE_W, h: NODE_H };
}

const DEFAULT_MARKER = {
  type: MarkerType.ArrowClosed,
  color: ARROW_COLOR,
  width: 14,
  height: 14,
};

function plainEdge(source: string, target: string, opt: Partial<Edge> = {}): Edge {
  return {
    id: `e-${source}-${target}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    target,
    type: 'smoothstep',
    style: { stroke: 'var(--edge-color)', strokeWidth: 2 },
    markerEnd: DEFAULT_MARKER,
    ...opt,
  };
}

function insertEdge(
  source: string,
  target: string,
  branchPath: BranchStep[],
  index: number,
  opt: Partial<Edge> = {},
): Edge {
  return {
    id: `e-${source}-${target}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    target,
    type: 'insert',
    data: { branchPath, index },
    style: { stroke: 'var(--edge-color)', strokeWidth: 2 },
    markerEnd: DEFAULT_MARKER,
    ...opt,
  };
}

function labeled<T extends Partial<Edge>>(label: string, opt: T): T & Partial<Edge> {
  return {
    ...opt,
    label,
    labelStyle: { fill: 'var(--text-primary)', fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: 'var(--bg-card)' },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
  };
}

function makeJoinNode(id: string, centerX: number, topY: number): Node {
  return {
    id,
    type: 'join',
    position: { x: centerX - JOIN_SIZE / 2, y: topY },
    data: {},
    draggable: false,
    selectable: false,
  };
}

function layoutStatement(
  stmt: Statement,
  centerX: number,
  topY: number,
): LaidOut {
  const { w, h } = statementSize(stmt.kind);

  if (stmt.kind === 'if') {
    const thenDry = layoutBranch(stmt.thenBranch, 0, 0, []);
    const elseDry = layoutBranch(stmt.elseBranch, 0, 0, []);

    const thenSideW = Math.max(thenDry.width, DIAMOND_W) + HORZ_GAP / 2;
    const elseSideW = Math.max(elseDry.width, DIAMOND_W) + HORZ_GAP / 2;
    const totalW = thenSideW + elseSideW;

    const thenCenterX = centerX - thenSideW / 2;
    const elseCenterX = centerX + elseSideW / 2;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: stmt.id,
      type: 'if',
      position: { x: centerX - w / 2, y: topY },
      data: { condition: stmt.condition, statementId: stmt.id, kind: 'if' },
    });

    const branchTopY = topY + h + VERT_GAP;
    const thenPath: BranchStep[] = [{ parentId: stmt.id, field: 'then' }];
    const elsePath: BranchStep[] = [{ parentId: stmt.id, field: 'else' }];
    const thenLaid = layoutBranch(stmt.thenBranch, thenCenterX, branchTopY, thenPath);
    const elseLaid = layoutBranch(stmt.elseBranch, elseCenterX, branchTopY, elsePath);

    nodes.push(...thenLaid.nodes, ...elseLaid.nodes);
    edges.push(...thenLaid.edges, ...elseLaid.edges);

    const branchesHeight = Math.max(thenLaid.height, elseLaid.height);
    const joinY = branchTopY + branchesHeight + VERT_GAP;
    const joinId = `__join-${stmt.id}`;
    nodes.push(makeJoinNode(joinId, centerX, joinY));

    if (thenLaid.entryId) {
      edges.push(insertEdge(stmt.id, thenLaid.entryId, thenPath, 0,
        labeled('V', { sourceHandle: 'left' })));
    } else {
      edges.push(insertEdge(stmt.id, joinId, thenPath, 0,
        labeled('V', { sourceHandle: 'left' })));
    }
    if (elseLaid.entryId) {
      edges.push(insertEdge(stmt.id, elseLaid.entryId, elsePath, 0,
        labeled('F', { sourceHandle: 'right' })));
    } else {
      edges.push(insertEdge(stmt.id, joinId, elsePath, 0,
        labeled('F', { sourceHandle: 'right' })));
    }

    if (thenLaid.exitId) edges.push(plainEdge(thenLaid.exitId, joinId,
      thenLaid.exitHandle ? { sourceHandle: thenLaid.exitHandle } : {}));
    if (elseLaid.exitId) edges.push(plainEdge(elseLaid.exitId, joinId,
      elseLaid.exitHandle ? { sourceHandle: elseLaid.exitHandle } : {}));

    const height = (joinY + JOIN_SIZE) - topY;
    return {
      nodes,
      edges,
      width: totalW,
      height,
      entryId: stmt.id,
      exitId: joinId,
    };
  }

  if (stmt.kind === 'while') {
    const bodyDry = layoutBranch(stmt.body, 0, 0, []);
    const bodyOffset = Math.max(bodyDry.width / 2, DIAMOND_W / 2) + HORZ_GAP;
    const bodyCenterX = centerX + bodyOffset;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: stmt.id,
      type: 'while',
      position: { x: centerX - w / 2, y: topY },
      data: { condition: stmt.condition, statementId: stmt.id, kind: 'while' },
    });

    const bodyTopY = topY + h + VERT_GAP;
    const bodyPath: BranchStep[] = [{ parentId: stmt.id, field: 'body' }];
    const bodyLaid = layoutBranch(stmt.body, bodyCenterX, bodyTopY, bodyPath);
    nodes.push(...bodyLaid.nodes);
    edges.push(...bodyLaid.edges);

    if (bodyLaid.entryId) {
      edges.push(insertEdge(stmt.id, bodyLaid.entryId, bodyPath, 0,
        labeled('V', { sourceHandle: 'right' })));
      if (bodyLaid.exitId) {
        edges.push(plainEdge(bodyLaid.exitId, stmt.id, {
          sourceHandle: bodyLaid.exitHandle,
          targetHandle: 'rightTarget',
          type: 'smoothstep',
          style: {
            stroke: 'var(--node-control)',
            strokeWidth: 2.5,
            strokeDasharray: '6 4',
          },
        }));
      }
    }

    const totalH = Math.max(h, h + VERT_GAP + bodyLaid.height);
    const totalW = bodyOffset + bodyDry.width / 2 + DIAMOND_W / 2;
    return {
      nodes,
      edges,
      width: totalW,
      height: totalH,
      entryId: stmt.id,
      exitId: stmt.id,
      exitHandle: 'bottom',
      exitLabel: 'F',
    };
  }

  return {
    nodes: [{
      id: stmt.id,
      type: stmt.kind,
      position: { x: centerX - w / 2, y: topY },
      data: { ...stmt, statementId: stmt.id },
    }],
    edges: [],
    width: w,
    height: h,
    entryId: stmt.id,
    exitId: stmt.id,
  };
}

function layoutBranch(
  statements: Statement[],
  centerX: number,
  topY: number,
  path: BranchStep[],
): LaidOut {
  if (statements.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0, entryId: null, exitId: null };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let currentY = topY;
  let width = 0;
  let firstEntry: string | null = null;
  let prevExit: string | null = null;
  let prevExitHandle: string | undefined = undefined;
  let prevExitLabel: string | undefined = undefined;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const laid = layoutStatement(stmt, centerX, currentY);
    nodes.push(...laid.nodes);
    edges.push(...laid.edges);
    width = Math.max(width, laid.width);

    if (firstEntry === null) firstEntry = laid.entryId;

    if (prevExit && laid.entryId) {
      const opts: Partial<Edge> = prevExitHandle ? { sourceHandle: prevExitHandle } : {};
      const withMaybeLabel = prevExitLabel ? labeled(prevExitLabel, opts) : opts;
      edges.push(insertEdge(prevExit, laid.entryId, path, i, withMaybeLabel));
    }

    prevExit = laid.exitId;
    prevExitHandle = laid.exitHandle;
    prevExitLabel = laid.exitLabel;
    currentY += laid.height + VERT_GAP;
  }

  return {
    nodes,
    edges,
    width,
    height: currentY - topY - VERT_GAP,
    entryId: firstEntry,
    exitId: prevExit,
    exitHandle: prevExitHandle,
    exitLabel: prevExitLabel,
  };
}

export interface RenderResult {
  nodes: Node[];
  edges: Edge[];
}

export function renderProgram(program: FlowProgram): RenderResult {
  const centerX = 0;
  const startY = 0;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const startId = '__start__';
  nodes.push({
    id: startId,
    type: 'terminal',
    position: { x: centerX - NODE_W / 2, y: startY },
    data: { label: 'Início', variant: 'start' },
    draggable: false,
    selectable: false,
  });

  const rootPath: BranchStep[] = [];
  const branch = layoutBranch(
    program.statements,
    centerX,
    startY + NODE_H + VERT_GAP,
    rootPath,
  );
  nodes.push(...branch.nodes);
  edges.push(...branch.edges);

  if (branch.entryId) {
    edges.push(insertEdge(startId, branch.entryId, rootPath, 0));
  }

  const endY = (branch.entryId ? startY + NODE_H + VERT_GAP + branch.height : startY + NODE_H) + VERT_GAP;
  const endId = '__end__';
  nodes.push({
    id: endId,
    type: 'terminal',
    position: { x: centerX - NODE_W / 2, y: endY },
    data: { label: 'Fim', variant: 'end' },
    draggable: false,
    selectable: false,
  });

  if (branch.exitId) {
    const opts: Partial<Edge> = branch.exitHandle ? { sourceHandle: branch.exitHandle } : {};
    const withMaybeLabel = branch.exitLabel ? labeled(branch.exitLabel, opts) : opts;
    edges.push(insertEdge(branch.exitId, endId, rootPath, program.statements.length, withMaybeLabel));
  } else {
    edges.push(insertEdge(startId, endId, rootPath, 0));
  }

  return { nodes, edges };
}
