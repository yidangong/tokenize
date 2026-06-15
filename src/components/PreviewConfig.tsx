import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ColorToken } from '../lib/types';
import { useTokens, type PreviewRole } from '../store/tokens';

const ROLES: { key: PreviewRole; label: string; help: string }[] = [
  { key: 'primary', label: 'Primary', help: 'Brand color used by buttons, links, accents' },
  { key: 'surface', label: 'Surface', help: 'Card / input / panel background' },
  { key: 'success', label: 'Success', help: 'Positive state — confirmations, "active"' },
  { key: 'warning', label: 'Warning', help: 'Caution — pending, "heads up"' },
  { key: 'danger', label: 'Danger', help: 'Error — failed, destructive' },
  { key: 'info', label: 'Info', help: 'Neutral note — tips, new' },
];

export function PreviewConfigPanel({
  colors,
  resolved,
}: {
  colors: ColorToken[];
  resolved: Partial<Record<PreviewRole, ColorToken | null>>;
}) {
  const open = useTokens((s) => s.previewConfigOpen);
  const toggle = useTokens((s) => s.togglePreviewConfig);
  const config = useTokens((s) => s.previewConfig);
  const setRole = useTokens((s) => s.setPreviewRole);
  const reset = useTokens((s) => s.resetPreviewConfig);

  const hasOverrides = Object.keys(config).length > 0;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
      <button
        type="button"
        onClick={toggle}
        className="-m-1 flex w-full items-center justify-between gap-2 rounded p-1 text-left transition hover:bg-[var(--color-surface)]"
      >
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-sm text-[var(--color-text)]">Preview config</h3>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {hasOverrides ? `${Object.keys(config).length} overridden` : 'auto-detected'}
          </span>
        </div>
        <span
          className="font-mono text-xs text-[var(--color-text-muted)] transition-transform"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▸
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ROLES.map((r) => (
                <RolePicker
                  key={r.key}
                  role={r.key}
                  label={r.label}
                  help={r.help}
                  colors={colors}
                  value={config[r.key] ?? null}
                  resolved={resolved[r.key] ?? null}
                  onChange={(name) => setRole(r.key, name)}
                />
              ))}
            </div>
            {hasOverrides && (
              <button
                type="button"
                onClick={reset}
                className="mt-3 text-xs text-[var(--color-text-muted)] underline-offset-2 hover:underline"
              >
                Reset all to auto
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RolePicker({
  label,
  help,
  colors,
  value,
  resolved,
  onChange,
}: {
  role: PreviewRole;
  label: string;
  help: string;
  colors: ColorToken[];
  value: string | null;
  resolved: ColorToken | null;
  onChange: (name: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  const showSwatch = resolved?.value ?? null;
  const showName = value ?? (resolved ? `${resolved.name} (auto)` : '— none —');
  const isAuto = value === null;

  return (
    <div className="relative" title={help}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-left transition hover:border-[var(--color-text-muted)]"
      >
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {showSwatch ? (
            <div
              className="h-3 w-3 rounded-sm border border-black/10"
              style={{ background: showSwatch }}
            />
          ) : (
            <div className="h-3 w-3 rounded-sm border border-dashed border-[var(--color-border)]" />
          )}
          <span
            className={
              'font-mono text-[11px] ' +
              (isAuto ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]')
            }
          >
            {showName.length > 18 ? showName.slice(0, 17) + '…' : showName}
          </span>
          <span aria-hidden className="text-[var(--color-text-muted)]">▾</span>
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-1 shadow-xl scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-[var(--color-surface)] ' +
              (isAuto ? 'bg-[var(--color-surface)]' : '')
            }
          >
            <div className="h-3 w-3 rounded-sm border border-dashed border-[var(--color-border)]" />
            <span className="text-[var(--color-text-muted)]">Auto-detect</span>
          </button>
          <div className="my-1 h-px bg-[var(--color-border)]" />
          {colors.map((c) => {
            const active = value === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onChange(c.name);
                  setOpen(false);
                }}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition hover:bg-[var(--color-surface)] ' +
                  (active ? 'bg-[var(--color-surface)]' : '')
                }
              >
                <div
                  className="h-3 w-3 rounded-sm border border-black/10"
                  style={{ background: c.value }}
                />
                <span className="font-mono text-[var(--color-text)] truncate">{c.name}</span>
                <span className="ml-auto font-mono text-[10px] text-[var(--color-text-muted)]">
                  {c.value}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
