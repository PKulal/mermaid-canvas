import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMermaidStore } from '@/store/mermaid-store';
import { parseDiagramForPresent } from '@/lib/mermaid-parser';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, X, CheckCircle2 } from 'lucide-react';

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

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'Escape') { onExit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, back, onExit]);

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

  const { graph, currentNodeId, visitedPath } = present;
  const current = graph[currentNodeId];
  const total = Object.keys(graph).length;
  const visitedCount = visitedPath.length;
  const isLeaf = current.children.length === 0;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Top bar — breadcrumb + exit */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/60 backdrop-blur">
        <div className="flex items-center gap-1.5 flex-wrap text-sm">
          {visitedPath.map((id, i) => {
            const node = graph[id];
            const isLast = i === visitedPath.length - 1;
            return (
              <div key={id} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
                <button
                  onClick={() => goToNode(id)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                    isLast
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {node?.label || id}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={enterFullscreen} className="h-8">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExit} className="h-8 gap-1.5">
            <X className="w-3.5 h-3.5" /> Exit Present
          </Button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-4xl flex flex-col items-center gap-12"
          >
            {/* Active node */}
            <div className={`relative w-full max-w-2xl panel rounded-xl px-10 py-12 text-center shadow-elevated border-2 ${isLeaf ? 'border-success/60' : 'border-primary/60'}`}>
              <div className={`absolute -inset-px rounded-xl blur-2xl opacity-30 ${isLeaf ? 'bg-success' : 'bg-primary'} pointer-events-none`} />
              <div className="relative">
                <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Current Step</div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight break-words">{current.label}</h2>
                {isLeaf && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm">
                    <CheckCircle2 className="w-4 h-4" /> End of this path
                  </div>
                )}
              </div>
            </div>

            {/* Children */}
            {!isLeaf && (
              <div className="w-full">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  Click to expand · {current.children.length} {current.children.length === 1 ? 'path' : 'paths'}
                </div>
                <div className="flex flex-wrap items-stretch justify-center gap-4">
                  {current.children.map((cid) => {
                    const child = graph[cid];
                    if (!child) return null;
                    const visited = visitedPath.includes(cid);
                    return (
                      <motion.button
                        key={cid}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => goToNode(cid)}
                        className={`min-w-[160px] max-w-[260px] px-6 py-5 rounded-lg text-center transition-all ${
                          visited
                            ? 'border border-border bg-surface text-muted-foreground'
                            : 'border-2 border-dashed border-primary/40 bg-surface hover:bg-primary/5 hover:border-primary text-foreground'
                        }`}
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

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-elevated/60 backdrop-blur">
        <Button variant="outline" size="sm" onClick={back} disabled={visitedPath.length <= 1} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="text-xs font-mono text-muted-foreground">
          {visitedCount} / {total} nodes visited
        </div>
        <Button size="sm" onClick={next} disabled={isLeaf} className="gap-1.5">
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
