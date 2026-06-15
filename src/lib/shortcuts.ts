import { useEffect } from 'react';

export type ShortcutSpec = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  ignoreInEditor?: boolean;
  handler: (e: KeyboardEvent) => void;
};

function inEditor(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.monaco-editor'));
}

export function useShortcuts(specs: ShortcutSpec[]): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      for (const s of specs) {
        const wantMeta = s.meta ?? true;
        const meta = e.metaKey || e.ctrlKey;
        if (wantMeta !== meta) continue;
        if ((s.shift ?? false) !== e.shiftKey) continue;
        if ((s.alt ?? false) !== e.altKey) continue;
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;
        if (s.ignoreInEditor && inEditor(e.target)) continue;
        e.preventDefault();
        e.stopPropagation();
        s.handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
  }, [specs]);
}

export function formatShortcut(parts: { meta?: boolean; shift?: boolean; alt?: boolean; key: string }): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.platform);
  const out: string[] = [];
  if (parts.meta ?? true) out.push(isMac ? '⌘' : 'Ctrl');
  if (parts.shift) out.push(isMac ? '⇧' : 'Shift');
  if (parts.alt) out.push(isMac ? '⌥' : 'Alt');
  out.push(parts.key.length === 1 ? parts.key.toUpperCase() : parts.key);
  return out.join(isMac ? '' : '+');
}
