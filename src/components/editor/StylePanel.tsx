import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMermaidStore } from '@/store/mermaid-store';
import {
  FONT_FAMILIES,
  type MermaidTheme,
  type ThemeVariables,
} from '@/lib/mermaid-init';

const THEME_PRESETS: { value: MermaidTheme; label: string }[] = [
  { value: 'default', label: 'Default (brand)' },
  { value: 'base', label: 'Base (custom)' },
  { value: 'dark', label: 'Dark' },
  { value: 'forest', label: 'Forest' },
  { value: 'neutral', label: 'Neutral' },
];

const COLOR_FIELDS: { key: keyof ThemeVariables; label: string; fallback: string }[] = [
  { key: 'primaryColor', label: 'Node fill', fallback: '#ECECFF' },
  { key: 'primaryTextColor', label: 'Node text', fallback: '#333333' },
  { key: 'primaryBorderColor', label: 'Node border', fallback: '#9370DB' },
  { key: 'lineColor', label: 'Line / arrow', fallback: '#333333' },
  { key: 'background', label: 'Background', fallback: '#FFFFFF' },
];

export function StylePanel() {
  const style = useMermaidStore((s) => s.customStyle);
  const setCustomStyle = useMermaidStore((s) => s.setCustomStyle);
  const resetCustomStyle = useMermaidStore((s) => s.resetCustomStyle);

  const setTheme = (theme: MermaidTheme) => {
    setCustomStyle({ ...style, theme });
  };

  const setVar = <K extends keyof ThemeVariables>(key: K, value: ThemeVariables[K]) => {
    const themeVariables = { ...style.themeVariables, [key]: value };
    if (value === undefined || value === '') delete themeVariables[key];
    // Custom variables only take effect on the 'base' theme — auto-switch.
    const theme: MermaidTheme = style.theme === 'default' ? 'base' : style.theme;
    setCustomStyle({ theme, themeVariables });
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Diagram Style</h3>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={resetCustomStyle} title="Reset">
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-xs">Reset</span>
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Theme preset</label>
        <Select value={style.theme} onValueChange={(v) => setTheme(v as MermaidTheme)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_PRESETS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Colors</label>
        {COLOR_FIELDS.map((field) => {
          const current = style.themeVariables[field.key] ?? field.fallback;
          return (
            <div key={field.key} className="flex items-center justify-between gap-2">
              <span className="text-xs">{field.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current}
                  onChange={(e) => setVar(field.key, e.target.value)}
                  className="h-7 w-10 rounded border border-border bg-transparent cursor-pointer"
                  aria-label={field.label}
                />
                <button
                  type="button"
                  onClick={() => setVar(field.key, undefined)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  title="Clear"
                >
                  clear
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Font family</label>
        <Select
          value={style.themeVariables.fontFamily ?? ''}
          onValueChange={(v) => setVar('fontFamily', v || undefined)}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}
