export interface FlowNode {
  id: string;
  label: string;
  children: string[];
  parents: string[];
}

export type Graph = Record<string, FlowNode>;

/**
 * Parse a Mermaid flowchart into an adjacency list.
 * Supports: A[Label] --> B[Label], A --> B, with optional |edge label|.
 * Falls back to treating any encountered token as a node.
 */
export function parseFlowchart(code: string): { graph: Graph; root: string | null } {
  const graph: Graph = {};
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);

  const ensure = (id: string, label?: string) => {
    if (!graph[id]) graph[id] = { id, label: label || id, children: [], parents: [] };
    else if (label && graph[id].label === id) graph[id].label = label;
  };

  // Match a node token: ID, ID[label], ID(label), ID{label}, ID((label)), ID>label]
  const nodeRe = /([A-Za-z_][\w-]*)(?:\s*(?:\[([^\]]+)\]|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\}|>\s*([^\]]+)\]))?/;

  // Edge regex covering common arrows
  const edgeRe = new RegExp(
    nodeRe.source + '\\s*(?:--[->.x]+|==+>|-\\.->|--o|--x)\\s*(?:\\|[^|]*\\|\\s*)?' + nodeRe.source,
    'g'
  );

  for (const raw of lines) {
    if (/^(flowchart|graph|subgraph|end|classDef|class\s|click|style|linkStyle|%%|direction)/i.test(raw)) continue;

    edgeRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    let matched = false;
    while ((m = edgeRe.exec(raw)) !== null) {
      matched = true;
      const fromId = m[1];
      const fromLabel = m[2] || m[3] || m[4] || m[5] || m[6];
      const toId = m[7];
      const toLabel = m[8] || m[9] || m[10] || m[11] || m[12];
      ensure(fromId, fromLabel);
      ensure(toId, toLabel);
      if (!graph[fromId].children.includes(toId)) graph[fromId].children.push(toId);
      if (!graph[toId].parents.includes(fromId)) graph[toId].parents.push(fromId);
    }

    if (!matched) {
      // Lone node declaration like "A[Label]"
      const single = raw.match(new RegExp('^' + nodeRe.source + '\\s*$'));
      if (single) {
        const id = single[1];
        const label = single[2] || single[3] || single[4] || single[5] || single[6];
        ensure(id, label);
      }
    }
  }

  // Root: first node with no parents
  const ids = Object.keys(graph);
  const root = ids.find(id => graph[id].parents.length === 0) || ids[0] || null;
  return { graph, root };
}

/** Sequence diagram parser → linear graph of participant interactions. */
export function parseSequence(code: string): { graph: Graph; root: string | null } {
  const graph: Graph = {};
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
  const seqRe = /^([A-Za-z_][\w\s]*?)\s*(->>?|-->>?|-x|--x)\s*([A-Za-z_][\w\s]*?)\s*:\s*(.+)$/;

  let prevId: string | null = null;
  let i = 0;
  for (const line of lines) {
    if (/^(sequenceDiagram|participant|actor|note|loop|alt|else|end|opt|par|rect|activate|deactivate|autonumber)/i.test(line)) continue;
    const m = line.match(seqRe);
    if (m) {
      const id = `step${i++}`;
      const label = `${m[1].trim()} → ${m[3].trim()}: ${m[4].trim()}`;
      graph[id] = { id, label, children: [], parents: [] };
      if (prevId) {
        graph[prevId].children.push(id);
        graph[id].parents.push(prevId);
      }
      prevId = id;
    }
  }
  const ids = Object.keys(graph);
  return { graph, root: ids[0] || null };
}

export function parseDiagramForPresent(code: string): { graph: Graph; root: string | null } {
  const trimmed = code.trim();
  if (/^sequenceDiagram/i.test(trimmed)) return parseSequence(code);
  return parseFlowchart(code);
}

export function totalNodes(graph: Graph) {
  return Object.keys(graph).length;
}
