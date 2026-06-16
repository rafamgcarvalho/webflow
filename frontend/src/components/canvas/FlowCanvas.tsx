import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { FlowProgram } from '../../types/flow';
import { renderProgram } from '../../services/flowRender';
import { nodeTypes } from '../nodes';
import InsertEdge from '../edges/InsertEdge';
import { useFlowContext } from '../../contexts/FlowContext';

interface Props {
  program: FlowProgram;
  editMode: boolean;
}

const EDITABLE_KINDS = new Set(['assign', 'declare', 'input', 'output', 'if', 'while']);

export default function FlowCanvas({ program, editMode }: Props) {
  const { onEditStatement } = useFlowContext();

  const edgeTypes: EdgeTypes = useMemo(() => ({ insert: InsertEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const result = renderProgram(program);
    setNodes(result.nodes);
    setEdges(result.edges);
    // Reposiciona a viewport pra mostrar o novo conteúdo — sem isso, ao trocar
    // de fluxo a câmera fica onde estava e os nós novos podem cair fora da tela.
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.3, duration: 400 });
    });
    return () => cancelAnimationFrame(id);
  }, [program, editMode, setNodes, setEdges, fitView]);

  const handleNodeClick = useCallback((_e: unknown, node: Node) => {
    if (node.type && EDITABLE_KINDS.has(node.type)) {
      const id = (node.data as { statementId?: string }).statementId;
      if (id) onEditStatement(id);
    }
  }, [onEditStatement]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 400 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(148,163,184,0.12)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
