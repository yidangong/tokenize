import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  FONTS,
  findFontByValue,
  loadGoogleFont,
  preloadAllGoogleFonts,
  type FontOption,
} from '../lib/fonts';

interface Props {
  value: string | undefined;
  onChange: (option: FontOption) => void;
}

export function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const currentFont = findFontByValue(value);
  const displayName = currentFont?.name ?? value ?? 'pick font';

  useEffect(() => {
    if (open) preloadAllGoogleFonts();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  const grouped: Partial<Record<FontOption['category'], FontOption[]>> = {};
  for (const f of FONTS) {
    (grouped[f.category] ??= []).push(f);
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Click to change font family"
        className="inline-block rounded px-1 py-[1px] font-mono text-[10px] tabular-nums normal-case tracking-normal text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
      >
        {displayName}
        <span className="ml-0.5" aria-hidden>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full z-30 mt-1 max-h-80 w-72 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-1 shadow-xl scrollbar-thin"
          >
            {CATEGORY_ORDER.map((cat) => {
              const fonts = grouped[cat];
              if (!fonts || fonts.length === 0) return null;
              return (
                <div key={cat} className="px-1 pb-1.5 pt-1">
                  <div className="mb-1 px-1.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    {CATEGORY_LABEL[cat]}
                  </div>
                  {fonts.map((f) => {
                    const isActive = currentFont?.name === f.name;
                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => {
                          if (f.google) loadGoogleFont(f.name);
                          onChange(f);
                          setOpen(false);
                        }}
                        onMouseEnter={() => f.google && loadGoogleFont(f.name)}
                        className={
                          'flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm transition hover:bg-[var(--color-surface)] ' +
                          (isActive ? 'bg-[var(--color-surface)]' : '')
                        }
                      >
                        <span
                          style={{ fontFamily: f.cssValue }}
                          className="text-[var(--color-text)]"
                        >
                          {f.name}
                        </span>
                        {isActive && (
                          <span className="font-mono text-[10px] text-[var(--color-accent)]">●</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
