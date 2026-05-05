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
import { TemplatesDialog } from '@/components/editor/TemplatesDialog';
import { HistorySidebar } from '@/components/editor/HistorySidebar';
import { PresentMode } from '@/components/editor/PresentMode';
import { detectDiagramType } from '@/lib/mermaid-utils';
import { exportPNG, exportPDF, exportSVG, copyShareUrl } from '@/lib/exporters';
import { parseDiagramForPresent } from '@/lib/mermaid-parser';

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

  const [debouncedCode, setDebouncedCode] = useState(code);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState('preview');
  const svgRef = useRef<SVGElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

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
              theme="mermaidflow-dark"
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} title="Zoom out">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(z => Math.min(3, z + 0.1))} title="Zoom in">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(1)} title="Fit">
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

            <TabsContent value="preview" className="flex-1 m-0 overflow-auto">
              <div ref={previewWrapRef} className="min-h-full flex items-center justify-center p-8">
                {isEmpty || error ? (
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow">
                      <Sparkles className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">MermaidFlow</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {error ? 'Fix the syntax error to see your diagram.' : 'Paste your Mermaid code on the left to get started.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
                    <MermaidDiagram
                      code={debouncedCode}
                      idPrefix="preview"
                      onError={setError}
                      onSvg={(s) => { svgRef.current = s; }}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="present" className="flex-1 m-0 flex flex-col">
              {tab === 'present' && <PresentMode onExit={() => setTab('preview')} />}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
