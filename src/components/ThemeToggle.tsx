import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMermaidStore } from '@/store/mermaid-store';

interface Props {
  className?: string;
  size?: 'sm' | 'icon';
}

export function ThemeToggle({ className = '', size = 'sm' }: Props) {
  const uiTheme = useMermaidStore(s => s.uiTheme);
  const toggleUiTheme = useMermaidStore(s => s.toggleUiTheme);
  const label = uiTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleUiTheme}
      className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${className}`}
      title={label}
      aria-label={label}
    >
      {uiTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
