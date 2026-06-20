import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTokens } from '../store/tokens';
import { FORMATS, OUTPUT_FORMATS } from '../lib/types';
import { serialize } from '../lib/serializers';

function diffLines(oldText: string, newText: string): number[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const changed: number[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) changed.push(i + 1);
  }
  return changed;
}

export function OutputPanel() {
  const tokens = useTokens((s) => s.parseResult.tokens);
  const activeOutput = useTokens((s) => s.activeOutput);
  const setActiveOutput = useTokens((s) => s.setActiveOutput);
  const naming = useTokens((s) => s.naming);
  const theme = useTokens((s) => s.theme);
  const mobileView = useTokens((s) => s.mobileView);
  const lastEdit = useTokens((s) => s.lastEdit);
  const [copied, setCopied] = useState(false);
  const [lineBadge, setLineBadge] = useState<string | null>(null);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const output = useMemo(() => serialize(tokens, activeOutput, naming), [tokens, activeOutput, naming]);

  useEffect(() => {
    if (!lastEdit || !editorRef.current) return;
    const editor = editorRef.current;

    const prevOutput = serialize(lastEdit.prevTokens, activeOutput, naming);
    const lines = diffLines(prevOutput, output);

    if (lines.length === 0) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
      setLineBadge(null);
      return;
    }

    const decorations: MonacoEditor.IModelDeltaDecoration[] = lines.map((line) => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: 'tokenize-changed-line',
      },
    }));

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
    editor.revealLineInCenterIfOutsideViewport(lines[0]);

    setLineBadge(`${lines.length} line${lines.length === 1 ? '' : 's'} · L${lines.join(', L')}`);
  }, [lastEdit, activeOutput, naming, output]);

  const onMount = (editor: MonacoEditor.IStandaloneCodeEditor, _monaco: Monaco) => {
    editorRef.current = editor;
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  };

  const visible = mobileView === 'output';

  return (
    <section
      className={
        (visible ? 'flex' : 'hidden xl:flex') +
        ' h-full min-h-0 min-w-0 flex-col border-r border-[var(--color-border)]'
      }
    >
      <div className="flex flex-col gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex min-h-[28px] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-thin">
            <div className="shrink-0 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Output
            </div>
            <div className="flex shrink-0 gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              {OUTPUT_FORMATS.map((f) => {
                const active = activeOutput === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveOutput(f)}
                    className={
                      'relative rounded px-2 py-1 text-xs whitespace-nowrap transition ' +
                      (active
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
                    }
                  >
                    {active && (
                      <motion.span
                        layoutId="output-tab-indicator"
                        className="absolute inset-0 rounded bg-[var(--color-canvas)] shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative z-10">{FORMATS[f].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <motion.button
              type="button"
              onClick={() => useTokens.getState().downloadOutput()}
              whileTap={{ scale: 0.94 }}
              aria-label="Download output as file"
              title="Download as file"
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs transition hover:border-[var(--color-text-muted)]"
            >
              ↓
            </motion.button>
            <motion.button
              type="button"
              onClick={onCopy}
              whileTap={{ scale: 0.94 }}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs transition hover:border-[var(--color-text-muted)]"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block text-[var(--color-accent)]"
                  >
                    ✓ Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block"
                  >
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
        <div className="flex min-h-[18px] items-center">
          <AnimatePresence mode="wait" initial={false}>
            {lineBadge ? (
              <motion.span
                key="badge"
                initial={{ opacity: 0, scale: 0.9, x: -4 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-[1px] font-mono text-[10px] text-[var(--color-accent)]"
              >
                {lineBadge}
              </motion.span>
            ) : (
              <motion.span
                key="subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate text-xs text-[var(--color-text-muted)]"
              >
                read-only · updates as you type
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          value={output}
          language={FORMATS[activeOutput].monacoLang}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onMount={onMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'none',
          }}
        />
      </div>
    </section>
  );
}
