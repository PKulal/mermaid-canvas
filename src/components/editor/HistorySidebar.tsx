import { useMermaidStore } from '@/store/mermaid-store';
import { Button } from '@/components/ui/button';
import { History, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function HistorySidebar() {
  const [open, setOpen] = useState(false);
  const history = useMermaidStore(s => s.history);
  const setCode = useMermaidStore(s => s.setCode);
  const clearHistory = useMermaidStore(s => s.clearHistory);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="History"
        className="w-12 shrink-0 flex flex-col items-center py-3 gap-3 border-r border-border bg-surface-elevated"
      >
        <div className={`p-2 rounded-md transition-colors ${open ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <History className="w-4 h-4" />
        </div>
      </button>
      {open && (
        <aside className="w-72 shrink-0 border-r border-border bg-surface flex flex-col animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">History</h3>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button onClick={clearHistory} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-surface-hover" title="Clear">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No diagrams yet. Edit a diagram and it will be saved here.
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                {history.map(h => (
                  <li key={h.id}>
                    <button
                      onClick={() => setCode(h.code)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-surface-hover transition-colors group"
                    >
                      <div className="text-sm font-medium truncate">{h.preview || 'Untitled'}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {formatDistanceToNow(h.timestamp, { addSuffix: true })}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
