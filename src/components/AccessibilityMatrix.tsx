import { motion } from 'motion/react';
import { useState } from 'react';
import type { ColorToken } from '../lib/types';
import { contrastRatio } from '../lib/util';

type Rating = 'AAA' | 'AA' | 'AA-large' | 'fail';

function rate(ratio: number | null): Rating {
  if (ratio == null) return 'fail';
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

const RATING_STYLE: Record<Rating, { bg: string; fg: string; label: string }> = {
  AAA: { bg: 'var(--color-accent)', fg: '#fff8f3', label: 'AAA' },
  AA: { bg: 'var(--color-accent-soft)', fg: 'var(--color-accent)', label: 'AA' },
  'AA-large': { bg: 'transparent', fg: 'var(--color-text-muted)', label: 'AA+' },
  fail: { bg: 'transparent', fg: 'var(--color-text-muted)', label: '—' },
};

export function AccessibilityMatrix({ colors }: { colors: ColorToken[] }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<{ fg: ColorToken; bg: ColorToken; ratio: number | null } | null>(null);

  if (colors.length < 2) return null;

  let bestPairs = 0;
  let aaPairs = 0;
  let failPairs = 0;
  for (const fg of colors) {
    for (const bg of colors) {
      if (fg.name === bg.name) continue;
      const r = rate(contrastRatio(fg.value, bg.value));
      if (r === 'AAA') bestPairs += 1;
      else if (r === 'AA') aaPairs += 1;
      else if (r === 'fail') failPairs += 1;
    }
  }

  const limited = colors.length > 16 ? colors.slice(0, 16) : colors;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="-m-1 flex w-full items-center justify-between gap-2 rounded p-1 text-left transition hover:bg-[var(--color-surface)]"
      >
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-sm text-[var(--color-text)]">Accessibility matrix</h3>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {bestPairs} AAA · {aaPairs} AA · {failPairs} fail
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

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 overflow-hidden"
        >
          <div className="mb-2 text-[10px] text-[var(--color-text-muted)]">
            Each cell shows the contrast of <strong>row color as text</strong> on <strong>column color as background</strong>. Hover for details.
            {colors.length > 16 && <> Showing first 16 of {colors.length} colors.</>}
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[var(--color-canvas)] p-0.5" />
                  {limited.map((c) => (
                    <th
                      key={c.name}
                      className="h-6 w-7 p-0"
                      title={`bg: ${c.name} · ${c.value}`}
                      style={{ background: c.value }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {limited.map((fg) => (
                  <tr key={fg.name}>
                    <th
                      className="sticky left-0 z-10 h-7 w-7 p-0"
                      title={`fg: ${fg.name} · ${fg.value}`}
                      style={{ background: fg.value }}
                    />
                    {limited.map((bg) => {
                      const same = fg.name === bg.name;
                      const ratio = same ? null : contrastRatio(fg.value, bg.value);
                      const r = same ? 'fail' : rate(ratio);
                      const style = RATING_STYLE[r];
                      return (
                        <td
                          key={`${fg.name}-${bg.name}`}
                          className="h-7 w-7 border border-[var(--color-canvas)] text-center align-middle"
                          style={{
                            background: same ? 'transparent' : style.bg,
                            color: style.fg,
                          }}
                          title={same ? '—' : `${fg.name} on ${bg.name}\n${ratio?.toFixed(2)}:1\n${r === 'fail' ? 'Fails WCAG AA' : r === 'AA-large' ? 'AA for large text only' : `Passes WCAG ${r}`}`}
                          onMouseEnter={() => !same && setHovered({ fg, bg, ratio })}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {same ? (
                            <span className="text-[10px] text-[var(--color-text-muted)]/40">·</span>
                          ) : (
                            <span
                              className="block text-center font-mono text-[7px] leading-none"
                              style={{ fontWeight: r === 'AAA' || r === 'AA' ? 600 : 400 }}
                            >
                              {style.label}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hovered && (
            <div className="mt-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs">
              <span className="font-mono text-[var(--color-text)]">{hovered.fg.name}</span>{' '}
              <span className="text-[var(--color-text-muted)]">on</span>{' '}
              <span className="font-mono text-[var(--color-text)]">{hovered.bg.name}</span>{' '}
              <span className="font-mono text-[var(--color-accent)]">{hovered.ratio?.toFixed(2)}:1</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
