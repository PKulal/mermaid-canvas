export type ThemeVariables = {
  primaryColor?: string;
  primaryTextColor?: string;
  primaryBorderColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  background?: string;
  mainBkg?: string;
  fontFamily?: string;
  fontSize?: string;
};

export type MermaidTheme = 'default' | 'base' | 'dark' | 'forest' | 'neutral';

export type MermaidStyle = {
  theme: MermaidTheme;
  themeVariables: ThemeVariables;
};

export const DEFAULT_STYLE: MermaidStyle = {
  theme: 'default',
  themeVariables: {},
};

// Locate an `%%{init: { ... }}%%` directive at the start of the code.
// Regex alone can't reliably handle the nested braces in the payload,
// so we anchor with a regex then walk the braces to find the matching close.
function findInitBlock(code: string): { payload: string; endIndex: number } | null {
  const m = code.match(/^\s*%%\{\s*init\s*:\s*/);
  if (!m) return null;
  const payloadStart = m[0].length;
  if (code[payloadStart] !== '{') return null;

  let depth = 0;
  for (let i = payloadStart; i < code.length; i++) {
    const ch = code[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const payload = code.slice(payloadStart, i + 1);
        const tail = code.slice(i + 1).match(/^\s*\}%%\s*\n?/);
        if (!tail) return null;
        return { payload, endIndex: i + 1 + tail[0].length };
      }
    }
  }
  return null;
}

export function parseStyle(code: string): { style: MermaidStyle; rest: string } {
  const block = findInitBlock(code);
  if (!block) return { style: { ...DEFAULT_STYLE }, rest: code };

  let parsed: { theme?: MermaidTheme; themeVariables?: ThemeVariables } = {};
  try {
    parsed = JSON.parse(block.payload);
  } catch {
    try {
      parsed = JSON.parse(block.payload.replace(/'/g, '"'));
    } catch {
      parsed = {};
    }
  }

  return {
    style: {
      theme: parsed.theme ?? 'default',
      themeVariables: parsed.themeVariables ?? {},
    },
    rest: code.slice(block.endIndex),
  };
}

export function isStyleActive(style: MermaidStyle): boolean {
  return style.theme !== 'default' || Object.keys(style.themeVariables).length > 0;
}

// Strip leading `%%{init: ... }%%` so it can't conflict with the runtime config.
export function stripInitBlock(code: string): string {
  return parseStyle(code).rest;
}

export const FONT_FAMILIES = [
  { label: 'System UI', value: '"trebuchet ms", verdana, arial, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Courier (mono)', value: '"Courier New", Courier, monospace' },
];
