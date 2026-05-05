import { create } from 'zustand';
import { DEFAULT_TEMPLATE } from '@/lib/templates';
import type { Graph } from '@/lib/mermaid-parser';

export interface HistoryItem {
  id: string;
  code: string;
  timestamp: number;
  preview: string; // first node label
}

interface PresentState {
  active: boolean;
  graph: Graph;
  root: string | null;
  currentNodeId: string | null;
  visitedPath: string[];
}

interface MermaidStore {
  code: string;
  diagramType: string;
  history: HistoryItem[];
  present: PresentState;
  diagramTheme: 'dark' | 'default';

  setCode: (code: string) => void;
  setDiagramType: (t: string) => void;
  setDiagramTheme: (t: 'dark' | 'default') => void;
  pushHistory: (item: HistoryItem) => void;
  loadHistory: (items: HistoryItem[]) => void;
  clearHistory: () => void;

  startPresent: (graph: Graph, root: string | null) => void;
  exitPresent: () => void;
  goToNode: (id: string) => void;
  back: () => void;
  next: () => void;
}

const STORAGE_KEY = 'mermaidflow:state:v1';
const HISTORY_KEY = 'mermaidflow:history:v1';

function loadInitialCode(): string {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATE.code;
  try {
    // URL hash takes priority
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      try { return decodeURIComponent(escape(atob(d))); } catch {}
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.code) return parsed.code;
    }
  } catch {}
  return DEFAULT_TEMPLATE.code;
}

function loadInitialHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const h = localStorage.getItem(HISTORY_KEY);
    if (h) return JSON.parse(h);
  } catch {}
  return [];
}

export const useMermaidStore = create<MermaidStore>((set, get) => ({
  code: loadInitialCode(),
  diagramType: 'flowchart',
  history: loadInitialHistory(),
  diagramTheme: 'dark',
  present: { active: false, graph: {}, root: null, currentNodeId: null, visitedPath: [] },

  setCode: (code) => set({ code }),
  setDiagramType: (diagramType) => set({ diagramType }),
  setDiagramTheme: (diagramTheme) => set({ diagramTheme }),

  pushHistory: (item) =>
    set((s) => {
      const next = [item, ...s.history.filter(h => h.code !== item.code)].slice(0, 20);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return { history: next };
    }),
  loadHistory: (items) => set({ history: items }),
  clearHistory: () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    set({ history: [] });
  },

  startPresent: (graph, root) =>
    set({ present: { active: true, graph, root, currentNodeId: root, visitedPath: root ? [root] : [] } }),
  exitPresent: () =>
    set({ present: { active: false, graph: {}, root: null, currentNodeId: null, visitedPath: [] } }),
  goToNode: (id) =>
    set((s) => {
      const { present } = s;
      if (!present.graph[id]) return {};
      const idx = present.visitedPath.indexOf(id);
      const visitedPath = idx >= 0 ? present.visitedPath.slice(0, idx + 1) : [...present.visitedPath, id];
      return { present: { ...present, currentNodeId: id, visitedPath } };
    }),
  back: () =>
    set((s) => {
      const { present } = s;
      if (present.visitedPath.length <= 1) return {};
      const visitedPath = present.visitedPath.slice(0, -1);
      const currentNodeId = visitedPath[visitedPath.length - 1];
      return { present: { ...present, currentNodeId, visitedPath } };
    }),
  next: () => {
    const { present, goToNode } = get();
    if (!present.currentNodeId) return;
    const node = present.graph[present.currentNodeId];
    const unvisited = node?.children.find(c => !present.visitedPath.includes(c));
    if (unvisited) goToNode(unvisited);
  },
}));

// Persist code to localStorage (debounced)
let saveTimer: number | undefined;
useMermaidStore.subscribe((state) => {
  if (typeof window === 'undefined') return;
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: state.code }));
    } catch {}
  }, 1000);
});
