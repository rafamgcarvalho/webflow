# Documentação Técnica — Flowgorithm Web

> **Versão:** 0.1.0  
> **Stack:** React.js (Vite) + TypeScript + React Flow + Tailwind CSS + Dagre  
> **Objetivo:** Leitura e renderização de arquivos `.fprg` do Flowgorithm em um canvas web interativo.

---

## 1. Arquitetura do Projeto

### 1.1 Estrutura de Pastas

```
web-flow/
├── public/
│   └── examples/
│       └── exemplo1.fprg              # Arquivo de exemplo para teste
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   └── FlowCanvas.tsx          # Canvas principal com React Flow
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Barra superior com branding
│   │   │   └── Sidebar.tsx             # Barra lateral (upload + paleta + info)
│   │   └── nodes/
│   │       ├── TerminalNode.tsx         # Nó Início/Fim (oval roxo)
│   │       ├── ProcessNode.tsx          # Nó Atribuição (retângulo azul)
│   │       ├── InputNode.tsx            # Nó Entrada (paralelogramo verde)
│   │       ├── OutputNode.tsx           # Nó Saída (paralelogramo invertido amber)
│   │       ├── DeclareNode.tsx          # Nó Declaração (retângulo tracejado teal)
│   │       └── index.ts                # Registro nodeTypes centralizado
│   ├── services/
│   │   ├── fprgParser.ts               # Parser XML → Nodes/Edges
│   │   └── layoutService.ts            # Cálculo de layout via Dagre
│   ├── types/
│   │   └── flowgorithm.ts              # Tipos TypeScript do domínio
│   ├── App.tsx                          # Componente raiz (estado + layout)
│   ├── main.tsx                         # Entry point
│   └── index.css                        # Estilos globais + design tokens
├── docs/
│   └── documentacao-tecnica.md          # Este arquivo
├── index.html                           # HTML principal
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 1.2 Responsabilidade de Cada Módulo

| Módulo | Responsabilidade |
|--------|-----------------|
| `App.tsx` | Componente raiz. Gerencia o estado global (`nodes`, `edges`, `parseResult`, `isLoading`, `error`). Recebe o arquivo do Sidebar via callback, executa o pipeline completo (parse → layout) e distribui os dados para o FlowCanvas. Usa `ReactFlowProvider` para encapsular o contexto do React Flow. |
| `Header.tsx` | Barra superior. Exibe o branding do projeto ("Flowgorithm Web") com ícone e nome. |
| `Sidebar.tsx` | Barra lateral esquerda (260px). Contém o botão de importação `.fprg` (que aciona um `<input type="file">` oculto), a paleta visual dos 6 tipos de símbolos, e — após importação — os metadados do arquivo (programa, autor, total de blocos, distribuição por tipo). |
| `FlowCanvas.tsx` | Área principal do canvas. Renderiza o `<ReactFlow>` com `Background` (pontos), `Controls` (zoom +/-), `MiniMap` (mapa com cores por tipo de nó) e os custom nodes. Quando não há dados, exibe um estado vazio centralizado. Usa `useNodesState` e `useEdgesState` para gerenciar o estado interno do React Flow. |
| `fprgParser.ts` | Serviço de parser. Lê o arquivo `.fprg` via `FileReader` (client-side), parseia o XML com `DOMParser` nativo do browser, extrai os statements de `<body>` e converte para arrays de `Node[]` e `Edge[]` do React Flow. Também extrai metadados (`<attributes>`) e retorna um `ParseResult` para a Sidebar. |
| `layoutService.ts` | Serviço de layout. Usa a biblioteca Dagre para criar um grafo direcionado, adicionar os nós com dimensões específicas por tipo, e calcular a posição X/Y de cada nó em layout vertical (Top-to-Bottom). Converte a posição central retornada pelo Dagre para o canto superior-esquerdo esperado pelo React Flow. |
| `flowgorithm.ts` | Definições de tipos TypeScript para todo o domínio: tipos de nós (`FlowNodeType`), dados do XML (`FprgProgram`, `FprgStatement`), dados dos custom nodes (`TerminalNodeData`, `ProcessNodeData`, etc.) e resultado do parse (`ParseResult`). |
| `nodes/*.tsx` | 5 componentes visuais customizados (Custom Nodes do React Flow). Cada um recebe os dados via `props.data`, renderiza a forma geométrica correspondente ao símbolo do fluxograma, e expõe Handles (conectores) para as edges. |
| `index.css` | Estilos globais: importação do Tailwind CSS, importação da fonte Inter (Google Fonts), design tokens via variáveis CSS, overrides do React Flow para o dark theme, animações customizadas (@keyframes), e estilização de scrollbar. |

### 1.3 Fluxo de Dados

O fluxo de dados da aplicação segue um pipeline unidirecional:

```
Usuário seleciona arquivo .fprg
         ↓
┌─────────────────┐
│   FileReader     │  ← Lê o arquivo como texto (UTF-8)
│   (client-side)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   DOMParser      │  ← Converte texto XML em Document
│   (nativo)       │
└────────┬────────┘
         ↓
┌─────────────────┐
│   fprgParser     │  ← Extrai statements e cria Nodes/Edges
│   (serviço)      │     sem coordenadas (position: 0,0)
└────────┬────────┘
         ↓
┌─────────────────┐
│   layoutService  │  ← Calcula posições X/Y via Dagre
│   (Dagre)        │     converte centro → canto superior-esquerdo
└────────┬────────┘
         ↓
┌─────────────────┐
│   App.tsx        │  ← Atualiza estado: setNodes, setEdges, setParseResult
│   (estado React) │     incrementa canvasKey para forçar re-render
└────────┬────────┘
      ↙       ↘
┌──────────┐  ┌────────────┐
│ Sidebar  │  │ FlowCanvas │  ← Renderiza os nós com React Flow
│ (info)   │  │ (ReactFlow)│
└──────────┘  └────────────┘
```

### 1.4 Orquestração no App.tsx

O `App.tsx` é o componente que coordena todo o fluxo. Os estados principais são:

```typescript
const [nodes, setNodes] = useState<Node[]>([]);         // Nós do React Flow
const [edges, setEdges] = useState<Edge[]>([]);         // Conexões entre nós
const [parseResult, setParseResult] = useState(null);   // Metadados para a Sidebar
const [isLoading, setIsLoading] = useState(false);      // Indicador de carregamento
const [error, setError] = useState(null);               // Mensagem de erro
const [canvasKey, setCanvasKey] = useState(0);           // Forçar re-render do canvas
```

O callback `handleFileUpload` executa o pipeline completo:
1. Chama `processFile(file)` — lê, parseia e converte o XML
2. Chama `calculateLayout(nodes, edges)` — calcula posições com Dagre
3. Atualiza todos os estados com os resultados
4. Incrementa `canvasKey` para forçar o `FlowCanvas` a recriar o `useNodesState` com os novos dados

O `canvasKey` é necessário porque o `useNodesState` do React Flow inicializa o estado apenas na montagem do componente. Sem a key, importar um novo arquivo não atualizaria o canvas.

---

## 2. Lógica do Parser

### 2.1 Pipeline de Processamento

O parser (`fprgParser.ts`) exporta 3 funções principais e 1 pipeline:

| Função | Entrada | Saída |
|--------|---------|-------|
| `readFprgFile(file)` | `File` | `string` (conteúdo XML) |
| `parseFprgXml(xml)` | `string` | `FprgProgram` (estrutura parseada) |
| `convertToReactFlow(program)` | `FprgProgram` | `{ nodes, edges, parseResult }` |
| `processFile(file)` | `File` | `{ nodes, edges, parseResult }` (pipeline completo) |

### 2.2 Formato do Arquivo .fprg

O arquivo `.fprg` é um XML com a seguinte hierarquia:

```xml
<?xml version="1.0"?>
<flowgorithm fileversion="4.x">
    <attributes>
        <attribute name="name" value="NomeDoPrograma"/>
        <attribute name="authors" value="NomeDoAutor"/>
        <attribute name="about" value="Descrição do programa"/>
    </attributes>
    <function name="Main" type="None" variable="">
        <parameters/>
        <body>
            <!-- Statements do fluxograma aqui -->
        </body>
    </function>
</flowgorithm>
```

O parser extrai os `<attribute>` como metadados e itera sobre os filhos diretos de `<body>`.

### 2.3 Mapeamento XML → Nós

Cada tag dentro de `<body>` é convertida em um tipo de nó do React Flow:

| Tag XML | Atributos Lidos | Tipo de Nó | Dados do Nó |
|---------|-----------------|-----------|-------------|
| `<declare>` | `name`, `type`, `array`, `size` | `declare` | `{ name, varType, isArray }` |
| `<assign>` | `variable`, `expression` | `process` | `{ variable, expression }` |
| `<input>` | `variable` | `input` | `{ variable }` |
| `<output>` | `expression`, `newline` | `output` | `{ expression, newline }` |

Adicionalmente, o parser **insere automaticamente** dois nós terminais:
- **Início** (`terminal`, `variant: 'start'`) — adicionado no topo antes de todos os statements
- **Fim** (`terminal`, `variant: 'end'`) — adicionado ao final depois de todos os statements

### 2.4 Geração de Edges

As edges são geradas sequencialmente, conectando cada nó ao próximo:

```
start → stmt-0 → stmt-1 → stmt-2 → ... → stmt-N → end
```

Cada edge usa o tipo `smoothstep` (linhas suaves com ângulos de 90°) e cor `#475569` (slate-600).

### 2.5 Exemplo Completo de Conversão

**XML de entrada (corpo do Main):**
```xml
<body>
    <declare name="N" type="Integer" array="False" size=""/>
    <input variable="N"/>
    <assign variable="NEXT" expression="N + 1"/>
    <output expression="NEXT" newline="True"/>
</body>
```

**Nodes gerados (6 nós: 2 terminais + 4 statements):**
```typescript
[
  { id: 'start',  type: 'terminal', position: {x:0, y:0}, data: { label: 'Início', variant: 'start' } },
  { id: 'stmt-0', type: 'declare',  position: {x:0, y:0}, data: { name: 'N', varType: 'Integer', isArray: false } },
  { id: 'stmt-1', type: 'input',    position: {x:0, y:0}, data: { variable: 'N' } },
  { id: 'stmt-2', type: 'process',  position: {x:0, y:0}, data: { variable: 'NEXT', expression: 'N + 1' } },
  { id: 'stmt-3', type: 'output',   position: {x:0, y:0}, data: { expression: 'NEXT', newline: true } },
  { id: 'end',    type: 'terminal', position: {x:0, y:0}, data: { label: 'Fim', variant: 'end' } },
]
```

> **Nota:** As posições `{x:0, y:0}` são temporárias — o `layoutService` calcula as posições reais com Dagre.

**Edges gerados (5 conexões):**
```typescript
[
  { id: 'edge-start-stmt-0',  source: 'start',  target: 'stmt-0' },
  { id: 'edge-stmt-0-stmt-1', source: 'stmt-0', target: 'stmt-1' },
  { id: 'edge-stmt-1-stmt-2', source: 'stmt-1', target: 'stmt-2' },
  { id: 'edge-stmt-2-stmt-3', source: 'stmt-2', target: 'stmt-3' },
  { id: 'edge-stmt-3-end',    source: 'stmt-3', target: 'end'    },
]
```

### 2.6 Tratamento de Entidades XML

O Flowgorithm codifica caracteres especiais nas expressões. O parser decodifica:
- `&quot;` → `"` (usado em strings literais como `"Digite um valor:"`)
- `&amp;` → `&`
- `&lt;` → `<`
- `&gt;` → `>`
- `&apos;` → `'`

### 2.7 Tratamento de Erros

O parser verifica:
1. **XML malformado** — se o `DOMParser` gera um `<parsererror>`, uma exceção é lançada com mensagem descritiva.
2. **Arquivo sem funções** — se nenhuma `<function>` é encontrada, uma exceção é lançada.
3. **Tags não suportadas** — tags como `<if>`, `<while>`, `<for>` são ignoradas com um `console.warn`, sem interromper o processamento.

---

## 3. Layout Automático com Dagre

### 3.1 Por que Dagre?

O arquivo `.fprg` do Flowgorithm **não armazena coordenadas X/Y** dos blocos — o software desktop calcula o posicionamento em tempo real. Como estamos renderizando em um canvas web, precisamos calcular essas posições. O Dagre é uma biblioteca JavaScript que implementa o algoritmo de layout hierárquico para grafos direcionados, ideal para fluxogramas verticais.

### 3.2 Configuração do Grafo

```typescript
dagreGraph.setGraph({
  rankdir: 'TB',       // Top-to-Bottom (de cima para baixo)
  nodesep: 40,         // Separação horizontal entre nós no mesmo rank (px)
  ranksep: 70,         // Separação vertical entre ranks diferentes (px)
  edgesep: 20,         // Separação entre edges paralelas (px)
  marginx: 40,         // Margem horizontal do grafo (px)
  marginy: 40,         // Margem vertical do grafo (px)
});
```

### 3.3 Dimensões por Tipo de Nó

Cada tipo de nó tem dimensões pré-definidas para o cálculo do layout:

| Tipo | Largura (px) | Altura (px) |
|------|-------------|-------------|
| `terminal` | 200 | 56 |
| `process` | 260 | 60 |
| `input` | 260 | 60 |
| `output` | 260 | 60 |
| `declare` | 260 | 60 |
| `default` | 240 | 56 |

### 3.4 Correção de Coordenadas

O Dagre retorna a posição **central** de cada nó (centro X, centro Y), mas o React Flow espera a posição do **canto superior-esquerdo**. A correção aplicada é:

```typescript
position: {
  x: dagreNode.x - nodeWidth / 2,
  y: dagreNode.y - nodeHeight / 2,
}
```

---

## 4. Custom Nodes — Guia de Estilização

### 4.1 Estrutura Geral dos Custom Nodes

Cada Custom Node segue o mesmo padrão:

```tsx
const CustomNode = memo(({ data }: NodeProps & { data: DataType }) => {
  return (
    <div className="group animate-fade-in-up">
      <Handle type="target" position={Position.Top} />    {/* Conector de entrada */}
      
      <div className="...estilos do corpo...">
        <div className="...ícone..."><IconComponent /></div>
        <div className="...conteúdo...">
          <span>LABEL DO TIPO</span>
          <span>dados dinâmicos</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />  {/* Conector de saída */}
    </div>
  );
});
```

O `memo()` evita re-renders desnecessários. A classe `group` do Tailwind permite efeitos de hover no container que afetam filhos (via `group-hover:`).

### 4.2 Formas Geométricas — Técnicas CSS

| Nó | Forma | Técnica CSS |
|----|-------|-------------|
| **Terminal** | Oval/Stadium | `rounded-full` (Tailwind — border-radius 9999px) |
| **Process** | Retângulo arredondado | `rounded-xl` (Tailwind — border-radius 12px) |
| **Input** | Paralelogramo | `transform: skewX(-10deg)` no wrapper + `skewX(10deg)` no conteúdo |
| **Output** | Paralelogramo invertido | `transform: skewX(10deg)` no wrapper + `skewX(-10deg)` no conteúdo |
| **Declare** | Retângulo tracejado | `border-2 border-dashed border-teal-400/40` (Tailwind) |

> **Nota técnica:** Os nós Input e Output usam `transform: skewX()` em vez de `clip-path` para a forma de paralelogramo. A técnica `clip-path` cortava o conteúdo textual nas bordas. Com `skewX()`, o wrapper externo é inclinado e o conteúdo interno recebe um contra-skew (valor oposto) para manter o texto legível e totalmente visível.

### 4.3 Paleta de Cores

Cada tipo de nó possui uma cor principal usada em gradiente, sombra e handles:

| Nó | Cor Principal | Gradiente CSS | Sombra (glow) |
|----|--------------|---------------|---------------|
| **Terminal** | Roxo (`#7c3aed`) | `from-purple-600 to-violet-600` | `rgba(124, 58, 237, 0.35)` |
| **Process** | Azul (`#2563eb`) | `from-blue-600 to-blue-700` | `rgba(37, 99, 235, 0.3)` |
| **Input** | Verde (`#059669`) | `from-emerald-600 to-emerald-700` | `rgba(5, 150, 105, 0.3)` |
| **Output** | Amber (`#d97706`) | `from-amber-600 to-amber-700` | `rgba(217, 119, 6, 0.3)` |
| **Declare** | Teal (`#0d9488`) | `from-teal-600/80 to-teal-700/80` | `rgba(13, 148, 136, 0.25)` |

### 4.4 Handles (Conectores)

Os handles conectam os nós entre si. São estilizados como círculos coloridos com borda:

```html
<Handle className="!w-3 !h-3 !bg-{color}-400 !border-2 !border-{color}-600 !rounded-full" />
```

- **Target** (entrada): posicionado no topo (`Position.Top`)
- **Source** (saída): posicionado embaixo (`Position.Bottom`)
- **Exceção**: O nó Terminal "Início" tem apenas source, e "Fim" tem apenas target.

### 4.5 Ícones (Lucide React)

Cada nó exibe um ícone que identifica visualmente o tipo de operação:

| Nó | Ícone Lucide | Significado |
|----|-------------|-------------|
| Terminal (Início) | `Play` | Símbolo de "play" |
| Terminal (Fim) | `Square` | Símbolo de "stop" |
| Process | `ArrowLeftRight` | Atribuição (troca de valores) |
| Input | `Download` | Dados entrando no programa |
| Output | `Upload` | Dados saindo do programa |
| Declare | `Variable` | Declaração de variável |

### 4.6 Efeitos e Animações

- **Gradientes** nos nós: `bg-gradient-to-r` com duas tonalidades da mesma cor
- **Sombras com glow colorido**: `shadow-[0_4px_20px_rgba(...)]` — sombra suave com a cor do nó
- **Hover**: escala sutil `group-hover:scale-[1.02]` + sombra mais intensa
- **Animação de entrada**: `animate-fade-in-up` (definida em `index.css` via `@keyframes fadeInUp`)
- **Brilho decorativo** (Process, Declare, Terminal): linha sutil no topo do nó via `bg-gradient-to-r from-transparent via-{color}/30 to-transparent`

### 4.7 React Flow — Overrides de CSS

Para integrar o dark theme, os seguintes estilos padrão do React Flow são sobrescritos em `index.css`:

| Elemento | Override aplicado |
|----------|-------------------|
| `.react-flow__node` | `background: transparent`, `border: none`, `box-shadow: none`, `padding: 0` — Remove o wrapper branco padrão do React Flow |
| `.react-flow__background` | Cor de fundo escura (`--bg-primary`) |
| `.react-flow__controls` | Background escuro, bordas sutis, border-radius 12px |
| `.react-flow__controls-button` | Transparente com hover escuro, ícones claros |
| `.react-flow__minimap` | Background escuro, bordas sutis, border-radius 12px |
| `.react-flow__edge-path` | Cor `--edge-color` (#475569), espessura 2px |
| `.react-flow__attribution` | `display: none` — oculta o crédito padrão |

---

## 5. Sistema de Tipos (TypeScript)

O arquivo `flowgorithm.ts` define todas as interfaces do domínio:

### 5.1 Tipos do XML (Parsing)

```typescript
// Tipos de statements suportados
type FlowNodeType = 'terminal' | 'process' | 'input' | 'output' | 'declare';

// Metadados extraídos de <attributes>
interface FprgMetadata { name, authors, about, fileVersion }

// Statements individuais — union type discriminada por 'type'
type FprgStatement = FprgDeclare | FprgAssign | FprgInput | FprgOutput;

// Estrutura completa do programa
interface FprgProgram { metadata: FprgMetadata; functions: FprgFunction[] }
```

### 5.2 Tipos dos Custom Nodes

Cada tipo de nó tem sua própria interface de dados:

```typescript
interface TerminalNodeData { label: string; variant: 'start' | 'end' }
interface ProcessNodeData  { variable: string; expression: string }
interface InputNodeData    { variable: string }
interface OutputNodeData   { expression: string; newline: boolean }
interface DeclareNodeData  { name: string; varType: string; isArray: boolean }
```

Todas as interfaces incluem `[key: string]: unknown` para compatibilidade com a tipagem genérica do React Flow.

### 5.3 Resultado do Parse

```typescript
interface ParseResult {
  metadata: FprgMetadata;                    // Metadados do arquivo
  nodeCount: number;                         // Total de nós (incluindo Início/Fim)
  statementTypes: Record<string, number>;    // Contagem por tipo (ex: { declare: 1, output: 4 })
}
```

---

## 6. Instruções de Execução

### 6.1 Pré-requisitos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 6.2 Instalação

```bash
# Navegue até o diretório do projeto
cd C:\TCC2\web-flow

# Instale as dependências
npm install
```

### 6.3 Executar em Modo de Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento Vite será iniciado em `http://localhost:5173/` com Hot Module Replacement (HMR).

### 6.4 Build de Produção

```bash
npm run build     # Gera o bundle em /dist
npm run preview   # Serve o build localmente para teste
```

### 6.5 Teste Rápido

1. Abra `http://localhost:5173/` no navegador
2. Clique em **"Importar .fprg"** na barra lateral
3. Selecione o arquivo `public/examples/exemplo1.fprg`
4. O fluxograma será renderizado automaticamente no canvas com layout vertical
5. Use scroll para zoom, clique e arraste para mover o canvas
6. Os nós podem ser arrastados individualmente
7. O minimap no canto inferior-esquerdo mostra a visão geral com cores por tipo

### 6.6 Dependências do Projeto

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `react` | ^19.x | Framework UI |
| `react-dom` | ^19.x | Renderização DOM |
| `@xyflow/react` | ^12.x | Biblioteca de diagramas (React Flow v12) |
| `dagre` | ^0.8.x | Algoritmo de layout hierárquico para grafos |
| `lucide-react` | ^1.x | Biblioteca de ícones SVG |
| `tailwindcss` | ^4.x | Framework CSS utilitário |
| `@tailwindcss/vite` | ^4.x | Plugin Vite para Tailwind CSS v4 |
| `typescript` | ^6.x | Tipagem estática |
| `@types/dagre` | ^0.7.x | Tipos TypeScript para Dagre |
| `@types/react` | ^19.x | Tipos TypeScript para React |
| `vite` | ^8.x | Bundler e dev server |
| `@vitejs/plugin-react` | ^4.x | Plugin Vite para React (JSX, Fast Refresh) |

---

## 7. Limitações Atuais

Esta versão possui as seguintes limitações intencionais:

- **Apenas leitura:** Não há edição interativa de fluxogramas (arrastar blocos para criar novos nós).
- **Apenas função Main:** O parser processa apenas a primeira função (`Main`) do arquivo.
- **Fluxo linear:** Não suporta tags de controle de fluxo (`<if>`, `<while>`, `<for>`, `<do>`).
- **Client-side only:** Toda a lógica roda no navegador, sem necessidade de backend.
- **Sem persistência:** Os dados importados existem apenas em memória — recarregar a página perde o fluxograma.

### 7.1 Próximas Etapas

- [ ] Suporte a estruturas condicionais (`<if>`) com ramificação True/False
- [ ] Suporte a laços de repetição (`<while>`, `<for>`, `<do>`)
- [ ] Edição interativa (drag-and-drop de blocos para o canvas)
- [ ] Exportação de volta para `.fprg`
- [ ] Execução/simulação passo-a-passo do fluxograma
- [ ] Suporte a múltiplas funções e chamadas de função (`<call>`)
