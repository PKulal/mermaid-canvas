import mermaid from 'mermaid';

let initialized = false;

export function initMermaid(theme: 'dark' | 'default' = 'dark') {
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'loose',
    fontFamily: 'DM Mono, ui-monospace, monospace',
    themeVariables: theme === 'dark' ? {
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
    } : undefined,
  });
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
