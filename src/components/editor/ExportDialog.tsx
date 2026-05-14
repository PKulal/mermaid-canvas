import { useEffect, useMemo, useState } from 'react';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exportPNG, exportPDF, exportSVG, svgToCanvas } from '@/lib/exporters';

export type ExportFormat = 'png' | 'svg' | 'pdf';

const FORMATS: { value: ExportFormat; label: string; icon: typeof FileImage; ext: string; desc: string }[] = [
  { value: 'png', label: 'PNG', icon: FileImage, ext: 'png', desc: 'Raster image, 2× scale. Best for slides and docs.' },
  { value: 'svg', label: 'SVG', icon: Download, ext: 'svg', desc: 'Vector — scales without quality loss. Best for the web.' },
  { value: 'pdf', label: 'PDF', icon: FileText, ext: 'pdf', desc: 'A4 page with the diagram centered. Best for printing.' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svgEl: SVGElement | null;
}

export function ExportDialog({ open, onOpenChange, svgEl }: Props) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Serialized SVG for the SVG / PDF preview panes
  const svgMarkup = useMemo(() => {
    if (!svgEl) return '';
    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.removeAttribute('style');
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.maxWidth = '100%';
    clone.style.maxHeight = '100%';
    return new XMLSerializer().serializeToString(clone);
  }, [svgEl, open]);

  // Generate a PNG preview only when needed
  useEffect(() => {
    let cancelled = false;
    setPngUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (!open || format !== 'png' || !svgEl) return;
    setGenerating(true);
    svgToCanvas(svgEl, 2)
      .then((canvas) =>
        new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No blob'))), 'image/png'))
      )
      .then((blob) => {
        if (cancelled) return;
        setPngUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not generate PNG preview');
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, format, svgEl]);

  const handleDownload = async () => {
    if (!svgEl) {
      toast.error('Nothing to export');
      return;
    }
    setDownloading(true);
    try {
      const filename = `diagram.${format}`;
      if (format === 'svg') exportSVG(svgEl, filename);
      else if (format === 'png') await exportPNG(svgEl, filename);
      else await exportPDF(svgEl, filename);
      toast.success(`Exported ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Export failed: ${e?.message || 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  const current = FORMATS.find((f) => f.value === format)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export diagram</DialogTitle>
          <DialogDescription>{current.desc}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const active = f.value === format;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-md border text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:bg-accent text-muted-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="relative h-72 rounded-md border border-border bg-[color:var(--background)] overflow-hidden">
          {!svgEl ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No diagram to preview
            </div>
          ) : format === 'png' ? (
            generating || !pngUrl ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating preview…
              </div>
            ) : (
              <img src={pngUrl} alt="PNG preview" className="w-full h-full object-contain bg-[#13161B]" />
            )
          ) : format === 'svg' ? (
            <div
              className="w-full h-full flex items-center justify-center p-4 [&_svg]:max-w-full [&_svg]:max-h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          ) : (
            // PDF preview: A4-proportioned page frame with the diagram centered
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div
                className="bg-[#13161B] shadow-lg flex items-center justify-center p-6 [&_svg]:max-w-full [&_svg]:max-h-full"
                style={{ aspectRatio: '210 / 297', height: '100%' }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!svgEl || downloading}>
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download {current.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
