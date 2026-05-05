import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TEMPLATES } from '@/lib/templates';
import { LayoutTemplate } from 'lucide-react';

interface Props {
  onSelect: (code: string) => void;
}

export function TemplatesDialog({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md gap-1.5 h-8">
          <LayoutTemplate className="w-3.5 h-3.5" /> Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-surface border-border rounded-lg">
        <DialogHeader>
          <DialogTitle>Starter templates</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.code); setOpen(false); }}
              className="text-left panel p-4 rounded-lg hover:border-primary/50 hover:bg-surface-hover transition-all"
            >
              <h4 className="font-semibold text-foreground">{t.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              <pre className="mt-3 text-[10px] font-mono text-muted-foreground/80 line-clamp-4 overflow-hidden">{t.code}</pre>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
