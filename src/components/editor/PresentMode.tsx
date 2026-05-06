import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMermaidStore } from '@/store/mermaid-store';
import { parseDiagramForPresent, type Graph } from '@/lib/mermaid-parser';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, X, CheckCircle2, Network, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'walk' | 'tree';

export function PresentMode({ onExit }: { onExit: () => void }) {
  const code = useMermaidStore(s => s.code);
  const present = useMermaidStore(s => s.present);
  const startPresent = useMermaidStore(s => s.startPresent);
  const goToNode = useMermaidStore(s => s.goToNode);
  const back = useMermaidStore(s => s.back);
  const next = useMermaidStore(s => s.next);
  const exitPresent = useMermaidStore(s => s.exitPresent);
  const containerRef = useRef<HTMLDivElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('walk');

  // Initialize on mount
  useEffect(() => {
    const { graph, root } = parseDiagramForPresent(code);
    if (!root || Object.keys(graph).length === 0) {
      setParseError('Could not parse this diagram for Present Mode. Try a flowchart or sequence diagram.');
      return;
    }
    setParseError(null);
    startPresent(graph, root);
    return () => exitPresent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard nav (only active in walk mode)
  useEffect(() => {
    if (mode !== 'walk') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'Escape') { onExit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, next, back, onExit]);

  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  if (parseError) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div className="max-w-md">
          <p className="text-muted-foreground">{parseError}</p>
          <Button onClick={onExit} variant="outline" className="mt-6">Back to Preview</Button>
        </div>
      </div>
    );
  }

  if (!present.active || !present.currentNodeId) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const { graph, root, currentNodeId, visitedPath } = present;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Top bar — breadcrumb (walk mode) + mode toggle + exit */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-surface-elevated/60 backdrop-blur">
        <div className="flex items-center gap-1.5 flex-wrap text-sm min-w-0">
          {mode === 'walk' && visitedPath.map((id, i) => {
            const node = graph[id];
            const isLast = i === visitedPath.length - 1;
            return (
              <div key={id} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
                <button
                  onClick={() => goToNode(id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-mono text-xs transition-colors',
                    isLast
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  )}
                >
                  {node?.label || id}
                </button>
              </div>
            );
          })}
          {mode === 'tree' && (
            <span className="text-xs font-mono text-muted-foreground">
              Click <span className="text-primary">{'>'}</span> to expand · <span className="text-primary">{'<'}</span> to collapse
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Walk / Tree toggle */}
          <div className="flex items-center gap-0.5 bg-surface border border-border rounded-md p-0.5">
            <button
              onClick={() => setMode('walk')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
                mode === 'walk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Step-through one node at a time"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Walk</span>
            </button>
            <button
              onClick={() => setMode('tree')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
                mode === 'tree' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Expandable tree view"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tree</span>
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={enterFullscreen} className="h-8 w-8 p-0" title="Toggle fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExit} className="h-8 gap-1.5">
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>

      {/* Mode-specific content */}
      {mode === 'walk' ? (
        <WalkView
          graph={graph}
          currentNodeId={currentNodeId}
          visitedPath={visitedPath}
          goToNode={goToNode}
          back={back}
          next={next}
        />
      ) : (
        <TreeView graph={graph} root={root} currentNodeId={currentNodeId} goToNode={goToNode} />
      )}
    </div>
  );
}

/* ───────────────────────── Walk view ───────────────────────── */

interface WalkProps {
  graph: Graph;
  currentNodeId: string;
  visitedPath: string[];
  goToNode: (id: string) => void;
  back: () => void;
  next: () => void;
}

function WalkView({ graph, currentNodeId, visitedPath, goToNode, back, next }: WalkProps) {
  const current = graph[currentNodeId];
  const total = Object.keys(graph).length;
  const visitedCount = visitedPath.length;
  const isLeaf = current.children.length === 0;

  return (
    <>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-4xl flex flex-col items-center gap-8 sm:gap-12"
          >
            <div className={cn(
              'relative w-full max-w-2xl panel rounded-xl px-6 sm:px-10 py-8 sm:py-12 text-center shadow-elevated border-2',
              isLeaf ? 'border-success/60' : 'border-primary/60'
            )}>
              <div className={cn(
                'absolute -inset-px rounded-xl blur-2xl opacity-30 pointer-events-none',
                isLeaf ? 'bg-success' : 'bg-primary'
              )} />
              <div className="relative">
                <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Current Step</div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight break-words">{current.label}</h2>
                {isLeaf && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm">
                    <CheckCircle2 className="w-4 h-4" /> End of this path
                  </div>
                )}
              </div>
            </div>

            {!isLeaf && (
              <div className="w-full">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  Click to expand · {current.children.length} {current.children.length === 1 ? 'path' : 'paths'}
                </div>
                <div className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                  {current.children.map(cid => {
                    const child = graph[cid];
                    if (!child) return null;
                    const visited = visitedPath.includes(cid);
                    return (
                      <motion.button
                        key={cid}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => goToNode(cid)}
                        className={cn(
                          'min-w-[140px] max-w-[260px] px-5 sm:px-6 py-4 sm:py-5 rounded-lg text-center transition-all',
                          visited
                            ? 'border border-border bg-surface text-muted-foreground'
                            : 'border-2 border-dashed border-primary/40 bg-surface hover:bg-primary/5 hover:border-primary text-foreground'
                        )}
                      >
                        <div className="font-medium">{child.label}</div>
                        <div className="text-[10px] font-mono mt-2 text-muted-foreground">
                          {visited ? 'visited' : 'click to expand →'}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-surface-elevated/60 backdrop-blur">
        <Button variant="outline" size="sm" onClick={back} disabled={visitedPath.length <= 1} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="text-xs font-mono text-muted-foreground">
          {visitedCount} / {total} visited
        </div>
        <Button size="sm" onClick={next} disabled={isLeaf} className="gap-1.5">
          <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── Tree view ───────────────────────── */

interface TreeProps {
  graph: Graph;
  root: string | null;
  currentNodeId: string;
  goToNode: (id: string) => void;
}

function TreeView({ graph, root, currentNodeId, goToNode }: TreeProps) {
  const allNodeIds = useMemo(() => Object.keys(graph), [graph]);
  // Initially expand only the root, so user starts with root + first level visible.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(root ? [root] : []));

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpanded(new Set(allNodeIds)), [allNodeIds]);
  const collapseAll = useCallback(() => setExpanded(new Set(root ? [root] : [])), [root]);

  if (!root) return <div className="flex-1 flex items-center justify-center text-muted-foreground">No root node</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6 sm:p-10">
        <TreeNode
          id={root}
          graph={graph}
          expanded={expanded}
          onToggle={toggle}
          currentNodeId={currentNodeId}
          goToNode={goToNode}
          visited={new Set()}
        />
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-border bg-surface-elevated/60 backdrop-blur">
        <div className="text-xs font-mono text-muted-foreground">
          {expanded.size} / {allNodeIds.length} expanded
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs">
            Collapse all
          </Button>
          <Button size="sm" onClick={expandAll} className="h-8 text-xs">
            Expand all
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TreeNodeProps {
  id: string;
  graph: Graph;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  currentNodeId: string;
  goToNode: (id: string) => void;
  visited: Set<string>;
}

function TreeNode({ id, graph, expanded, onToggle, currentNodeId, goToNode, visited }: TreeNodeProps) {
  const node = graph[id];
  if (!node || visited.has(id)) return null; // guard against cycles

  const childVisited = useMemo(() => new Set([...visited, id]), [visited, id]);
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(id);
  const isActive = id === currentNodeId;

  return (
    <div className="flex items-center gap-2">
      {/* Node box */}
      <button
        onClick={() => goToNode(id)}
        className={cn(
          'px-4 py-2.5 rounded-lg border-2 text-sm font-medium whitespace-nowrap transition-all max-w-[260px] truncate',
          isActive
            ? 'border-primary bg-primary/10 text-foreground shadow-glow'
            : 'border-border bg-surface text-foreground hover:border-primary/50 hover:bg-surface-hover'
        )}
        title={node.label}
      >
        {node.label}
      </button>

      {/* Expand/collapse button */}
      {hasChildren && (
        <button
          onClick={() => onToggle(id)}
          className={cn(
            'w-6 h-6 rounded-md border text-xs font-mono flex items-center justify-center shrink-0 transition-colors',
            isExpanded
              ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
              : 'border-border bg-surface-elevated text-muted-foreground hover:border-primary hover:text-primary'
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          title={isExpanded ? 'Collapse children' : `Expand ${node.children.length} ${node.children.length === 1 ? 'child' : 'children'}`}
        >
          {isExpanded ? '<' : '>'}
        </button>
      )}

      {/* Children column with connector lines */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-3 ml-2 relative">
          {node.children.map((cid, idx) => (
            <div key={cid} className="relative pl-8 flex items-center">
              {/* Horizontal connector stub at this child's vertical center */}
              <div className="absolute left-0 top-1/2 w-8 h-px bg-muted-foreground/40" />
              {/* Vertical connector from the previous sibling (also bridges the gap above) */}
              {idx > 0 && (
                <div className="absolute left-0 -top-3 bottom-1/2 w-px bg-muted-foreground/40" />
              )}
              {/* Vertical connector down to the next sibling */}
              {idx < node.children.length - 1 && (
                <div className="absolute left-0 top-1/2 bottom-0 w-px bg-muted-foreground/40" />
              )}
              <TreeNode
                id={cid}
                graph={graph}
                expanded={expanded}
                onToggle={onToggle}
                currentNodeId={currentNodeId}
                goToNode={goToNode}
                visited={childVisited}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
