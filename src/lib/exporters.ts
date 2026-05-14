import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportSVG(svgEl: SVGElement, filename = 'diagram.svg') {
  const clone = svgEl.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0" standalone="no"?>\n' + source], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

export async function svgToCanvas(svgEl: SVGElement, scale = 2): Promise<HTMLCanvasElement> {
  // Mermaid leaves the SVG with only a viewBox; <img> needs explicit width/height
  // attributes (not just CSS) to lay it out, otherwise it loads as 0×0 and the
  // canvas comes out blank.
  const bbox = svgEl.getBoundingClientRect();
  const w = Math.max(bbox.width, 400);
  const h = Math.max(bbox.height, 300);

  const clone = svgEl.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  // CSS sizing may have been added by the host page — drop it so the attrs win.
  clone.removeAttribute('style');

  const source = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.width = w;
  img.height = h;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Browser could not load the SVG image'));
      img.src = url;
    });
  } finally {
    // Revoke after the image has been decoded; revoking earlier can race.
  }

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#13161B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas;
}

export async function exportPNG(svgEl: SVGElement, filename = 'diagram.png') {
  const canvas = await svgToCanvas(svgEl, 2);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
  if (!blob) throw new Error('Failed to encode PNG (canvas may be tainted)');
  downloadBlob(blob, filename);
}

export async function exportPDF(svgEl: SVGElement, filename = 'diagram.pdf') {
  const canvas = await svgToCanvas(svgEl, 2);
  const dataUrl = canvas.toDataURL('image/png');
  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const ratio = Math.min((pageW - margin * 2) / canvas.width, (pageH - margin * 2) / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.setFillColor(13, 15, 18);
  pdf.rect(0, 0, pageW, pageH, 'F');
  pdf.addImage(dataUrl, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(filename);
}

export function buildShareUrl(code: string): string {
  const encoded = btoa(unescape(encodeURIComponent(code)));
  const url = new URL(window.location.href);
  url.searchParams.set('d', encoded);
  url.hash = '';
  return url.toString();
}

export async function copyShareUrl(code: string): Promise<string> {
  const url = buildShareUrl(code);
  await navigator.clipboard.writeText(url);
  return url;
}

export const __html2canvas = html2canvas;
