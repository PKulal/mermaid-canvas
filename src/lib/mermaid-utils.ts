import mermaid from 'mermaid';

let initialized = false;

export function initMermaid(theme: 'dark' | 'default' = 'dark') {
  if (theme === 'dark') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'DM Mono, ui-monospace, monospace',
      themeVariables: {
        darkMode: true,
        background: '#13161B',
        primaryColor: '#1a1f26',
        primaryTextColor: '#e8e6e0',
        primaryBorderColor: '#00D4AA',
        lineColor: '#00D4AA',
        secondaryColor: '#1f2630',
        tertiaryColor: '#13161B',
        mainBkg: '#1a1f26',
        nodeBorder: '#00D4AA',
        clusterBkg: '#13161B',
        clusterBorder: '#2a3340',
        titleColor: '#00D4AA',
        edgeLabelBackground: '#13161B',
        textColor: '#e8e6e0',
      },
    });
  } else {
    // Clean light theme — warm cream nodes, light-blue subgraphs, black borders
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: "'Sora', 'Inter', system-ui, sans-serif",
      themeVariables: {
        darkMode: false,
        background: '#FFFFFF',
        primaryColor: '#FBF1D0',
        primaryTextColor: '#0F172A',
        primaryBorderColor: '#0F172A',
        secondaryColor: '#E8EEFA',
        secondaryTextColor: '#0F172A',
        secondaryBorderColor: '#C7D2EA',
        tertiaryColor: '#FFFAF0',
        tertiaryTextColor: '#0F172A',
        tertiaryBorderColor: '#C7D2EA',
        mainBkg: '#FBF1D0',
        nodeBorder: '#0F172A',
        clusterBkg: '#E8EEFA',
        clusterBorder: '#C7D2EA',
        titleColor: '#0F172A',
        lineColor: '#0F172A',
        textColor: '#0F172A',
        edgeLabelBackground: '#FFFFFF',
        nodeTextColor: '#0F172A',
        labelTextColor: '#0F172A',
        // Sequence diagrams
        actorBkg: '#FBF1D0',
        actorBorder: '#0F172A',
        actorTextColor: '#0F172A',
        actorLineColor: '#0F172A',
        signalColor: '#0F172A',
        signalTextColor: '#0F172A',
        labelBoxBkgColor: '#FBF1D0',
        labelBoxBorderColor: '#0F172A',
        // Notes
        noteBkgColor: '#FFF6CF',
        noteTextColor: '#0F172A',
        noteBorderColor: '#E8C76C',
      },
    });
  }
  initialized = true;
}

export async function renderMermaid(id: string, code: string): Promise<{ svg: string } | { error: string }> {
  if (!initialized) initMermaid('dark');
  try {
    await mermaid.parse(code);
    const { svg } = await mermaid.render(id, code);
    return { svg };
  } catch (e: any) {
    return { error: e?.message || 'Invalid Mermaid syntax' };
  }
}

export function detectDiagramType(code: string): string {
  const first = code.trim().split('\n')[0]?.toLowerCase() || '';
  if (first.startsWith('flowchart') || first.startsWith('graph')) return 'flowchart';
  if (first.startsWith('sequencediagram')) return 'sequence';
  if (first.startsWith('erdiagram')) return 'er';
  if (first.startsWith('classdiagram')) return 'class';
  if (first.startsWith('gantt')) return 'gantt';
  if (first.startsWith('statediagram')) return 'state';
  if (first.startsWith('mindmap')) return 'mindmap';
  if (first.startsWith('pie')) return 'pie';
  if (first.startsWith('gitgraph')) return 'git';
  return 'flowchart';
}
