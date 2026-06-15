export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

const MIME_BY_EXT: Record<string, string> = {
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  swift: 'text/x-swift',
  xml: 'application/xml',
};

export function mimeForExt(ext: string): string {
  return MIME_BY_EXT[ext] ?? 'text/plain';
}
