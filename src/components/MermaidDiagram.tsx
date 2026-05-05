import { useEffect, useRef, useState } from 'react';
import { renderMermaid, initMermaid } from '@/lib/mermaid-utils';
import { useMermaidStore } from '@/store/mermaid-store';

interface Props {
  code: string;
  idPrefix?: string;
  className?: string;
  onError?: (err: string | null) => void;
  onSvg?: (svg: SVGElement | null) => void;
  themeOverride?: 'dark' | 'default';
}

let counter = 0;

export function MermaidDiagram({ code, idPrefix = 'mmd', className = '', onError, onSvg, themeOverride }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const diagramTheme = useMermaidStore(s => s.diagramTheme);
  const theme = themeOverride ?? diagramTheme;

  useEffect(() => {
    initMermaid(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!code.trim()) {
        if (ref.current) ref.current.innerHTML = '';
        setError(null);
        onError?.(null);
        onSvg?.(null);
        return;
      }
      const id = `${idPrefix}-${++counter}`;
      const result = await renderMermaid(id, code);
      if (cancelled || !ref.current) return;
      if ('error' in result) {
        setError(result.error);
        onError?.(result.error);
        onSvg?.(null);
      } else {
        ref.current.innerHTML = result.svg;
        const svg = ref.current.querySelector('svg');
        if (svg) {
          svg.removeAttribute('height');
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
        }
        setError(null);
        onError?.(null);
        onSvg?.((svg as SVGElement) || null);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [code, idPrefix, theme]);

  return <div ref={ref} className={`mermaid-render ${className}`} aria-hidden={!!error} />;
}
