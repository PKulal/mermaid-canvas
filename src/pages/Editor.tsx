import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowLeft, Copy, Download, FileImage, FileText,
  Maximize2, Moon, Play, Sparkles, Sun, ZoomIn, ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMermaidStore } from '@/store/mermaid-store';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TemplatesDialog } from '@/components/editor/TemplatesDialog';
import { HistorySidebar } from '@/components/editor/HistorySidebar';
import { PresentMode } from '@/components/editor/PresentMode';
import { detectDiagramType } from '@/lib/mermaid-utils';
import { exportPNG, exportPDF, exportSVG, copyShareUrl } from '@/lib/exporters';
import { parseDiagramForPresent } from '@/lib/mermaid-parser';
import { usePanZoom } from '@/hooks/use-pan-zoom';

const DIAGRAM_TYPES = [
  { v: 'flowchart', label: 'Flowchart' },
  { v: 'sequence', label: 'Sequence' },
  { v: 'er', label: 'ER' },
  { v: 'class', label: 'Class' },
  { v: 'gantt', label: 'Gantt' },
  { v: 'state', label: 'State' },
  { v: 'mindmap', label: 'Mindmap' },
  { v: 'pie', label: 'Pie' },
  { v: 'git', label: 'Git' },
];

// Configure Monaco mermaid-ish syntax highlighting once
let monacoConfigured = false;
function configureMonaco() {
  if (monacoConfigured) return;
  monacoConfigured = true;
  loader.init().then((monaco) => {
    monaco.languages.register({ id: 'mermaid' });
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          [/%%.*$/, 'comment'],
          [/^\s*(flowchart|graph|sequenceDiagram|erDiagram|classDiagram|stateDiagram(-v2)?|gantt|mindmap|pie|gitGraph|journey|requirementDiagram|C4Context)\b/, 'keyword'],
          [/\b(TD|TB|BT|RL|LR|subgraph|end|participant|actor|note|loop|alt|else|opt|par|rect|activate|deactivate|class|state|section|title|dateFormat|axisFormat)\b/, 'keyword'],
          [/-->|---|-\.->|==>|--x|--o|-x|->>|-->>|<<--/, 'operator'],
          [/\|[^|]*\|/, 'string'],
          [/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}/, 'string'],
          [/"[^"]*"/, 'string'],
          [/\b\d+\b/, 'number'],
        ],
      },
    });
    monaco.editor.defineTheme('mermaidflow-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '00D4AA', fontStyle: 'bold' },
        { token: 'string', foreground: 'E8E6E0' },
        { token: 'comment', foreground: '5b6470', fontStyle: 'italic' },
        { token: 'operator', foreground: '00D4AA' },
        { token: 'number', foreground: 'F5A623' },
      ],
      colors: {
        'editor.background': '#13161B',
        'editor.foreground': '#E8E6E0',
        'editor.lineHighlightBackground': '#1a1f26',
        'editorLineNumber.foreground': '#3e4750',
        'editorLineNumber.activeForeground': '#00D4AA',
        'editor.selectionBackground': '#00D4AA33',
        'editorCursor.foreground': '#00D4AA',
        'editorIndentGuide.background': '#1f262e',
        'editorWidget.background': '#1a1f26',
      },
    });
    monaco.editor.defineTheme('mermaidflow-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0F8A6F', fontStyle: 'bold' },
        { token: 'string', foreground: '1F2937' },
        { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
        { token: 'operator', foreground: '0F8A6F' },
        { token: 'number', foreground: 'B45309' },
      ],
      colors: {
        'editor.background': '#F7F8FA',
        'editor.foreground': '#1F2937',
        'editor.lineHighlightBackground': '#EEF1F5',
        'editorLineNumber.foreground': '#9AA4B2',
        'editorLineNumber.activeForeground': '#0F8A6F',
        'editor.selectionBackground': '#0F8A6F33',
        'editorCursor.foreground': '#0F8A6F',
        'editorIndentGuide.background': '#E2E8F0',
        'editorWidget.background': '#FFFFFF',
      },
    });
  });
}

function MobileBanner() {
  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-primary/15 border-b border-primary/30 text-primary text-center text-xs py-2 px-4 font-mono">
      Best viewed on desktop · 1024px+
    </div>
  );
}

export default function EditorPage() {
  const code = useMermaidStore(s => s.code);
  const setCode = useMermaidStore(s => s.setCode);
  const setDiagramType = useMermaidStore(s => s.setDiagramType);
  const diagramType = useMermaidStore(s => s.diagramType);
  const pushHistory = useMermaidStore(s => s.pushHistory);
  const diagramTheme = useMermaidStore(s => s.diagramTheme);
  const setDiagramTheme = useMermaidStore(s => s.setDiagramTheme);
  const uiTheme = useMermaidStore(s => s.uiTheme);

  const [debouncedCode, setDebouncedCode] = useState(code);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('preview');
  const [svgEl, setSvgEl] = useState<SVGElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const svgRef = useRef<SVGElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const { scale: zoom, translate: panTranslate, zoomIn, zoomOut, setView, setContentBounds, dragging } = usePanZoom(previewWrapRef);

  // Track container size so we can size the SVG in absolute pixels for crisp zoom
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute the diagram's natural aspect from its viewBox so we can size the SVG to match (no wasted letterbox)
  const fitInfo = useMemo(() => {
    if (!svgEl || containerSize.w === 0 || containerSize.h === 0) return null;
    const vb = svgEl.viewBox.baseVal;
    if (!vb || vb.width === 0 || vb.height === 0) return null;
    const fitScale = Math.min(containerSize.w / vb.width, containerSize.h / vb.height);
    const fitW = vb.width * fitScale;
    const fitH = vb.height * fitScale;
    return { fitW, fitH };
  }, [svgEl, containerSize.w, containerSize.h]);

  // Apply pixel dimensions to the rendered SVG so high-zoom stays crisp (vector-rendered)
  useEffect(() => {
    if (!svgEl || !fitInfo) return;
    svgEl.style.width = `${fitInfo.fitW * zoom}px`;
    svgEl.style.height = `${fitInfo.fitH * zoom}px`;
    svgEl.style.maxWidth = 'none';
    svgEl.style.maxHeight = 'none';
    svgEl.style.margin = '0';
    svgEl.style.display = 'block';
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }, [svgEl, zoom, fitInfo]);

  // Tell the pan-zoom hook about the diagram's natural fit dimensions so it can clamp pan
  // (and auto-center when the SVG is smaller than the pane in some dimension).
  useEffect(() => {
    if (!fitInfo) {
      setContentBounds(null);
      return;
    }
    setContentBounds({ contentW: fitInfo.fitW, contentH: fitInfo.fitH });
    // Re-apply current view through the constraint so it's clamped to the new bounds.
    setView({});
  }, [fitInfo, setContentBounds, setView]);

  // Center the diagram in the preview pane (fit-to-view)
  const fitToView = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, [setView]);

  // Auto-fit whenever a brand-new SVG element is rendered (new diagram).
  // This also covers the very first load.
  useEffect(() => {
    if (!svgEl || !fitInfo) return;
    fitToView();
  }, [svgEl, fitToView]);

  useEffect(() => { configureMonaco(); }, []);

  // Auto-detect diagram type
  useEffect(() => { setDiagramType(detectDiagramType(code)); }, [code, setDiagramType]);

  // Debounce render (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 300);
    return () => clearTimeout(t);
  }, [code]);

  // Save history (debounced 1.5s) when valid
  useEffect(() => {
    if (!debouncedCode.trim() || error) return;
    const t = setTimeout(() => {
      const { graph, root } = parseDiagramForPresent(debouncedCode);
      const preview = root ? graph[root]?.label || 'Untitled' : debouncedCode.split('\n')[0]?.slice(0, 40) || 'Untitled';
      pushHistory({ id: crypto.randomUUID(), code: debouncedCode, timestamp: Date.now(), preview });
      document.title = `MermaidFlow — ${preview}`;
    }, 1500);
    return () => clearTimeout(t);
  }, [debouncedCode, error, pushHistory]);

  // Cmd/Ctrl + Enter forces re-render
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        setDebouncedCode(code + ' '); // trigger render
        setTimeout(() => setDebouncedCode(code), 0);
        toast.success('Re-rendered');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code]);

  const handleExport = useCallback(async (kind: 'png' | 'svg' | 'pdf') => {
    if (!svgRef.current) { toast.error('Nothing to export'); return; }
    try {
      if (kind === 'svg') exportSVG(svgRef.current, 'diagram.svg');
      else if (kind === 'png') await exportPNG(svgRef.current, 'diagram.png');
      else await exportPDF(svgRef.current, 'diagram.pdf');
      toast.success(`Exported ${kind.toUpperCase()}`);
    } catch (e: any) {
      toast.error(`Export failed: ${e?.message || 'unknown error'}`);
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await copyShareUrl(code);
      toast.success('Copied shareable link');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }, [code]);

  const isEmpty = !debouncedCode.trim();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <MobileBanner />

      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-surface-elevated">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Home</span>
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-accent flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">MermaidFlow</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
            <Copy className="w-3.5 h-3.5" /> Copy Link
          </Button>
          <Button size="sm" onClick={() => setTab('present')} className="h-8 gap-1.5">
            <Play className="w-3.5 h-3.5" /> Present
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <HistorySidebar />

        {/* Code editor pane */}
        <section className="w-[34%] min-w-[360px] flex flex-col border-r border-border bg-surface">
          <div className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-border bg-surface-elevated">
            <div className="flex items-center gap-2">
              <Select value={diagramType} onValueChange={setDiagramType}>
                <SelectTrigger className="h-8 w-[140px] bg-surface border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAGRAM_TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <TemplatesDialog onSelect={setCode} />
            </div>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground">
              ⌘ + ↵ render
            </kbd>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              language="mermaid"
              theme={uiTheme === 'light' ? 'mermaidflow-light' : 'mermaidflow-dark'}
              value={code}
              onChange={(v) => setCode(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontFamily: 'DM Mono, ui-monospace, monospace',
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                tabSize: 2,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
              }}
            />
          </div>
          {error && (
            <div className="shrink-0 px-3 py-2.5 border-t border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 text-xs font-mono animate-fade-in">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          )}
        </section>

        {/* Right pane */}
        <section className="flex-1 flex flex-col bg-background min-w-0">
          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
            <div className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-border bg-surface-elevated">
              <TabsList className="bg-surface border border-border h-8">
                <TabsTrigger value="preview" className="text-xs h-6">Preview</TabsTrigger>
                <TabsTrigger value="present" className="text-xs h-6">Present</TabsTrigger>
              </TabsList>

              {tab === 'preview' && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={zoomOut} title="Zoom out">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={zoomIn} title="Zoom in">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fitToView} title="Fit to view">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setDiagramTheme(diagramTheme === 'dark' ? 'default' : 'dark')}
                    title="Toggle diagram theme">
                    {diagramTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => handleExport('png')}>
                    <FileImage className="w-3.5 h-3.5" /> PNG
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => handleExport('svg')}>
                    <Download className="w-3.5 h-3.5" /> SVG
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => handleExport('pdf')}>
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="preview" className="flex-1 m-0 relative overflow-hidden">
              {isEmpty || error ? (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow">
                      <Sparkles className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">MermaidFlow</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {error ? 'Fix the syntax error to see your diagram.' : 'Paste your Mermaid code on the left to get started.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  ref={previewWrapRef}
                  className="absolute inset-0 select-none"
                  style={{
                    cursor: dragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                  }}
                >
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      transform: panTranslate,
                      transformOrigin: '0 0',
                    }}
                  >
                    <MermaidDiagram
                      code={debouncedCode}
                      idPrefix="preview"
                      onError={setError}
                      onSvg={(s) => { svgRef.current = s; setSvgEl(s); }}
                      className="block pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
