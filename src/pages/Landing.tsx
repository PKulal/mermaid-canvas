import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Presentation, Download, Code2, History, Link as LinkIcon, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const HERO_FULL = `flowchart LR
    A[Login] --> B[Dashboard]
    B --> C[Reports]
    B --> D[Settings]
    C --> E[Export]
    D --> F[Profile]`;

const SHOWCASE = {
  flowchart: `flowchart TD
    Start([User Opens App]) --> Auth{Logged in?}
    Auth -->|Yes| Home[Home Feed]
    Auth -->|No| Login[Login Screen]
    Login --> Home
    Home --> Done([Ready])`,
  sequence: `sequenceDiagram
    User->>Browser: Click button
    Browser->>API: GET /data
    API->>DB: Query
    DB-->>API: Rows
    API-->>Browser: JSON
    Browser-->>User: Render`,
  er: `erDiagram
    USERS ||--o{ POSTS : writes
    POSTS ||--o{ COMMENTS : has
    USERS {
      uuid id PK
      string name
    }
    POSTS {
      uuid id PK
      string title
    }`,
  mindmap: `mindmap
  root((MermaidFlow))
    Editor
      Monaco
      Live preview
    Present
      Walkthrough
      Breadcrumbs
    Export
      PNG
      SVG
      PDF`,
};

function useTypewriter(text: string, speed = 18, startDelay = 200) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    let raf: number;
    const start = setTimeout(() => {
      const tick = () => {
        i += 2;
        setOut(text.slice(0, i));
        if (i < text.length) raf = window.setTimeout(tick, speed) as unknown as number;
      };
      tick();
    }, startDelay);
    return () => { clearTimeout(start); clearTimeout(raf); };
  }, [text, speed, startDelay]);
  return out;
}

const features = [
  { icon: Network, title: 'All Mermaid Types', desc: 'Flowchart, sequence, ER, class, Gantt, state, mindmap, and more. Paste any valid Mermaid syntax.' },
  { icon: Presentation, title: 'Present Mode ⭐', desc: 'Walk through your diagram interactively. Click any node to expand its children, step through flows like a presentation.' },
  { icon: Download, title: 'Export Anywhere', desc: 'Download as PNG, SVG, or PDF. Or copy a shareable URL — no account needed.' },
  { icon: Code2, title: 'Live Editor', desc: 'Monaco-powered editor with Mermaid syntax highlighting, error detection, and instant preview.' },
  { icon: History, title: 'Diagram History', desc: 'Last 20 diagrams saved locally in your browser. One click to reload.' },
  { icon: LinkIcon, title: 'Share by URL', desc: 'Entire diagram encoded in the URL. Paste and share — anyone can open and view instantly.' },
];

export default function Landing() {
  const animatedCode = useTypewriter(HERO_FULL, 14, 400);
  const [tab, setTab] = useState('flowchart');

  useEffect(() => { document.title = 'MermaidFlow — Mermaid Diagrams, Brought to Life'; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-mono">
            <div className="w-8 h-8 rounded-md bg-gradient-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">MermaidFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Features</a>
            <a href="#showcase" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline ml-4">Showcase</a>
            <ThemeToggle className="ml-4" />
            <Link to="/editor" className="ml-1">
              <Button size="sm" className="rounded-lg">Open Editor</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 min-h-screen flex flex-col justify-center bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Free · No login · 100% client-side
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              Your Mermaid Diagrams,<br />
              <span className="bg-gradient-accent bg-clip-text text-transparent glow-text">Brought to Life</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl"
            >
              Paste your Mermaid code. Visualize instantly. Present it interactively — node by node.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/editor">
                <Button size="lg" className="rounded-lg shadow-glow group">
                  Try Now
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <a href="#showcase">
                <Button size="lg" variant="outline" className="rounded-lg border-border bg-surface/50 hover:bg-surface">
                  See a Demo
                </Button>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-gradient-accent opacity-20 blur-3xl rounded-full" />
            <div className="relative panel shadow-elevated overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface-elevated">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs font-mono text-muted-foreground">flow.mmd</span>
              </div>
              <div className="grid md:grid-cols-2 min-h-[320px]">
                <pre className="p-4 text-xs font-mono text-muted-foreground bg-background/40 overflow-hidden whitespace-pre-wrap break-all border-r border-border">
                  {animatedCode}<span className="inline-block w-2 h-4 bg-primary align-middle animate-pulse ml-0.5" />
                </pre>
                <div className="p-4 flex items-center justify-center bg-surface">
                  {animatedCode.length > 30 && (
                    <MermaidDiagram code={animatedCode} idPrefix="hero" className="w-full" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border">
        <div className="container">
          <div className="max-w-2xl mb-14">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built for developers and analysts.</h2>
            <p className="mt-4 text-muted-foreground text-lg">A precision tool for turning text into visual story.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group panel p-6 rounded-lg hover:border-primary/40 hover:bg-surface-hover transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="py-24 border-t border-border bg-surface/30">
        <div className="container">
          <div className="max-w-2xl mb-10">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Live preview</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Code in. Diagram out.</h2>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-surface border border-border rounded-lg">
              <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
              <TabsTrigger value="sequence">Sequence</TabsTrigger>
              <TabsTrigger value="er">ER Diagram</TabsTrigger>
              <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
            </TabsList>
            {(Object.keys(SHOWCASE) as Array<keyof typeof SHOWCASE>).map(k => (
              <TabsContent key={k} value={k} className="mt-6">
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="grid lg:grid-cols-2 gap-4"
                >
                  <pre className="panel p-5 text-sm font-mono text-foreground/90 overflow-auto h-[420px]">{SHOWCASE[k]}</pre>
                  <div className="panel p-6 flex items-center justify-center h-[420px] overflow-hidden">
                    <MermaidDiagram
                      code={SHOWCASE[k]}
                      idPrefix={`show-${k}`}
                      className="w-full h-full flex items-center justify-center [&_svg]:!max-h-full [&_svg]:!max-w-full [&_svg]:!w-auto [&_svg]:!h-auto"
                    />
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
          <div className="mt-12 text-center">
            <Link to="/editor">
              <Button size="lg" className="rounded-lg shadow-glow">
                Open the Editor <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground font-mono">
          MermaidFlow — free and open source. No server. No login.
        </div>
      </footer>
    </div>
  );
}
