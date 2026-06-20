import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTokens } from '../store/tokens';
import { FORMATS, PARSEABLE_FORMATS } from '../lib/types';

export function InputPanel() {
  const input = useTokens((s) => s.input);
  const inputFormat = useTokens((s) => s.inputFormat);
  const setInput = useTokens((s) => s.setInput);
  const setInputFormat = useTokens((s) => s.setInputFormat);
  const theme = useTokens((s) => s.theme);
  const warnings = useTokens((s) => s.parseResult.warnings);
  const resetToDefault = useTokens((s) => s.resetToDefault);
  const mobileView = useTokens((s) => s.mobileView);
  const lastEdit = useTokens((s) => s.lastEdit);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [lineBadge, setLineBadge] = useState<string | null>(null);

  const isEmpty = input.trim().length === 0;
  const visible = mobileView === 'input';

  useEffect(() => {
    if (!lastEdit || !editorRef.current) return;
    const editor = editorRef.current;
    const lines = lastEdit.changedLines;
    if (lines.length === 0) return;

    const decorations: MonacoEditor.IModelDeltaDecoration[] = lines.map((line) => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: 'tokenize-changed-line',
      },
    }));

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
    editor.revealLineInCenterIfOutsideViewport(lines[0]);

    setLineBadge(`${lines.length} line${lines.length === 1 ? '' : 's'} changed · L${lines.join(', L')}`);
  }, [lastEdit]);

  const onMount = (editor: MonacoEditor.IStandaloneCodeEditor, _monaco: Monaco) => {
    editorRef.current = editor;
  };

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
              Input
            </div>
            <div className="flex shrink-0 gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              {PARSEABLE_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setInputFormat(f)}
                  className={
                    'rounded px-2 py-1 text-xs transition whitespace-nowrap ' +
                    (inputFormat === f
                      ? 'bg-[var(--color-canvas)] text-[var(--color-text)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
                  }
                >
                  {FORMATS[f].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={resetToDefault}
              title="Reset to a starter example"
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] transition hover:border-[var(--color-text-muted)] whitespace-nowrap"
            >
              ↻ Example
            </button>
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
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate text-xs text-[var(--color-text-muted)]"
              >
                edit the example or paste your own
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Editor
          value={input}
          language={FORMATS[inputFormat].monacoLang}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(v) => setInput(v ?? '')}
          onMount={onMount}
          options={{
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

        {isEmpty && (
          <div className="pointer-events-none absolute left-12 top-3 select-none font-mono text-xs text-[var(--color-text-muted)]/60">
            Paste your tokens here — format auto-detects
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="max-h-32 overflow-auto border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-muted)] scrollbar-thin">
          {warnings.map((w, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-[var(--color-accent)]">⚠</span> {w}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
