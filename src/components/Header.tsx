import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTokens } from '../store/tokens';
import { PRESETS } from '../lib/presets';
import { FORMATS, type NamingConvention } from '../lib/types';

const NAMING_OPTIONS: NamingConvention[] = ['kebab-case', 'camelCase', 'PascalCase'];

const NAMING_EXAMPLES: Record<NamingConvention, string> = {
  'kebab-case': 'color-brand-primary',
  'camelCase': 'colorBrandPrimary',
  'PascalCase': 'ColorBrandPrimary',
};

export function Header() {
  const theme = useTokens((s) => s.theme);
  const toggleTheme = useTokens((s) => s.toggleTheme);
  const naming = useTokens((s) => s.naming);
  const setNaming = useTokens((s) => s.setNaming);
  const inputFormat = useTokens((s) => s.inputFormat);
  const loadPreset = useTokens((s) => s.loadPreset);
  const openHelp = useTokens((s) => s.openHelp);

  const [presetOpen, setPresetOpen] = useState(false);

  useEffect(() => {
    const onClick = () => setPresetOpen(false);
    if (presetOpen) {
      window.addEventListener('click', onClick);
      return () => window.removeEventListener('click', onClick);
    }
  }, [presetOpen]);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo />
        <div className="flex items-baseline gap-2">
          <div className="font-display text-xl tracking-tight leading-none">Tokenize</div>
          <div className="hidden text-xs text-[var(--color-text-muted)] lg:block">
            Design tokens between every format
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm sm:gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPresetOpen((v) => !v);
            }}
            className="whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 transition hover:border-[var(--color-text-muted)]"
          >
            <span className="hidden sm:inline">Load preset</span>
            <span className="sm:hidden">Presets</span>
            <span className="ml-1">↓</span>
          </button>
          {presetOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-30 mt-1 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                  onClick={() => {
                    loadPreset(p.id);
                    setPresetOpen(false);
                  }}
                >
                  <div className="font-medium text-[var(--color-text)]">{p.label}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{p.description}</div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="hidden items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 sm:flex" title="Naming convention for output token names">
          {NAMING_OPTIONS.map((n) => {
            const active = naming === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setNaming(n)}
                title={`${n} — e.g. ${NAMING_EXAMPLES[n]}`}
                className={
                  'relative rounded px-2 py-1 text-xs transition ' +
                  (active
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
                }
              >
                {active && (
                  <motion.span
                    layoutId="header-naming-indicator"
                    className="absolute inset-0 rounded bg-[var(--color-canvas)] shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative z-10">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden text-xs text-[var(--color-text-muted)] xl:block">
          <span className="font-mono">{FORMATS[inputFormat].label}</span>
        </div>

        <button
          type="button"
          onClick={openHelp}
          aria-label="About Tokenize"
          className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:border-[var(--color-text-muted)]"
        >
          <span className="font-mono text-sm" aria-hidden>?</span>
        </button>

        <button
          type="button"
          onClick={() => useTokens.getState().shareUrl()}
          aria-label="Copy share link"
          title="Copy a shareable link to this exact state"
          className="hidden h-8 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 transition hover:border-[var(--color-text-muted)] sm:inline-flex"
        >
          <span aria-hidden>↗</span>
          <span className="text-xs">Share</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:border-[var(--color-text-muted)]"
        >
          <span aria-hidden>{theme === 'dark' ? '☀︎' : '☾'}</span>
        </button>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <a href="/" aria-label="Tokenize home" className="block shrink-0">
      <svg viewBox="0 0 32 32" width="28" height="28" className="block">
        <rect width="32" height="32" rx="7" fill="var(--color-accent)" />
        <path d="M9 9.5h14v3.6h-5.2V23h-3.6V13.1H9z" fill="#fff8f3" />
        <circle cx="23.5" cy="22.5" r="1.8" fill="#fff8f3" />
      </svg>
    </a>
  );
}
