import { motion } from 'motion/react';
import type { ColorToken, SpacingToken, TypographyToken } from '../lib/types';
import { contrastRatio } from '../lib/util';
import { useTokens } from '../store/tokens';

interface ContrastBuckets {
  aaa: number;
  aaPlus: number;
  aa: number;
  fail: number;
  best: number;
  worst: number;
}

function bucketContrast(colors: ColorToken[]): ContrastBuckets {
  const buckets: ContrastBuckets = { aaa: 0, aaPlus: 0, aa: 0, fail: 0, best: 0, worst: Infinity };
  for (const c of colors) {
    const vsWhite = contrastRatio('#ffffff', c.value) ?? 0;
    const vsBlack = contrastRatio('#0a0a0a', c.value) ?? 0;
    const best = Math.max(vsWhite, vsBlack);
    if (best > buckets.best) buckets.best = best;
    if (best < buckets.worst) buckets.worst = best;
    if (best >= 7) buckets.aaa += 1;
    else if (best >= 4.5) buckets.aa += 1;
    else if (best >= 3) buckets.aaPlus += 1;
    else buckets.fail += 1;
  }
  if (buckets.worst === Infinity) buckets.worst = 0;
  return buckets;
}

function range(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function TokenSummary({
  colors,
  spacing,
  typography,
}: {
  colors: ColorToken[];
  spacing: SpacingToken[];
  typography: TypographyToken[];
}) {
  const lastEdit = useTokens((s) => s.lastEdit);

  const total = colors.length + spacing.length + typography.length;
  if (total === 0) return null;

  const buckets = bucketContrast(colors);
  const spacingRange = range(spacing.map((s) => s.value));
  const typeRange = range(typography.map((t) => t.fontSize ?? 0).filter((n) => n > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-sm text-[var(--color-text)]">Token summary</h3>
          {lastEdit && (
            <motion.span
              key={lastEdit.id}
              initial={{ opacity: 0, scale: 0.9, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-[1px] font-mono text-[10px] text-[var(--color-accent)]"
            >
              updated
            </motion.span>
          )}
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{total} total</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="colors" value={colors.length} />
        <Stat label="spacings" value={spacing.length} />
        <Stat label="type roles" value={typography.length} />
      </div>

      {colors.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>WCAG contrast</span>
            <span className="normal-case tracking-normal">
              {buckets.worst.toFixed(1)}:1 → {buckets.best.toFixed(1)}:1
            </span>
          </div>
          <ContrastBar buckets={buckets} total={colors.length} />
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
            <Legend swatch="aaa" label={`AAA ${buckets.aaa}`} />
            <Legend swatch="aa" label={`AA ${buckets.aa}`} />
            <Legend swatch="aaPlus" label={`AA+ ${buckets.aaPlus}`} />
            <Legend swatch="fail" label={`fail ${buckets.fail}`} />
          </div>
        </div>
      )}

      {(spacingRange || typeRange) && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {spacingRange && (
            <RangeRow label="Spacing" value={`${spacingRange.min}px → ${spacingRange.max}px`} />
          )}
          {typeRange && (
            <RangeRow label="Type size" value={`${typeRange.min}px → ${typeRange.max}px`} />
          )}
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
      <div className="font-display text-xl leading-none text-[var(--color-text)]">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}

function ContrastBar({ buckets, total }: { buckets: ContrastBuckets; total: number }) {
  if (total === 0) return null;
  const seg = (n: number) => (n / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]/40">
      {buckets.aaa > 0 && (
        <div
          className="h-full bg-[var(--color-accent)]"
          style={{ width: `${seg(buckets.aaa)}%` }}
          title={`${buckets.aaa} AAA`}
        />
      )}
      {buckets.aa > 0 && (
        <div
          className="h-full bg-[var(--color-accent)]/70"
          style={{ width: `${seg(buckets.aa)}%` }}
          title={`${buckets.aa} AA`}
        />
      )}
      {buckets.aaPlus > 0 && (
        <div
          className="h-full bg-[var(--color-accent)]/40"
          style={{ width: `${seg(buckets.aaPlus)}%` }}
          title={`${buckets.aaPlus} AA+ (large only)`}
        />
      )}
      {buckets.fail > 0 && (
        <div
          className="h-full bg-[var(--color-text-muted)]/40"
          style={{ width: `${seg(buckets.fail)}%` }}
          title={`${buckets.fail} fail`}
        />
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: 'aaa' | 'aa' | 'aaPlus' | 'fail'; label: string }) {
  const bg =
    swatch === 'aaa'
      ? 'bg-[var(--color-accent)]'
      : swatch === 'aa'
        ? 'bg-[var(--color-accent)]/70'
        : swatch === 'aaPlus'
          ? 'bg-[var(--color-accent)]/40'
          : 'bg-[var(--color-text-muted)]/40';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${bg}`} aria-hidden />
      {label}
    </span>
  );
}

function RangeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="font-mono text-xs text-[var(--color-text)]">{value}</span>
    </div>
  );
}
