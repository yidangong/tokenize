import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTokens } from '../store/tokens';
import { contrastRatio } from '../lib/util';
import { sampleTextFor, resetSampleSequence } from '../lib/preview-text';
import { resolveAllRoles } from '../lib/preview-roles';
import { suggestContrastFix, formatOklch, formatOklchShort, summarizeGroupOklch } from '../lib/palette';
import { PreviewConfigPanel } from './PreviewConfig';
import { TokenSummary } from './TokenSummary';
import { EditableNumber } from './EditableNumber';
import { FontPicker } from './FontPicker';
import { AddColorForm, AddPaletteForm, AddSpacingForm, AddTypographyForm } from './AddTokenForms';
import { AccessibilityMatrix } from './AccessibilityMatrix';
import type { ColorToken, SpacingToken, TypographyToken } from '../lib/types';

type WcagRating = 'AAA' | 'AA' | 'AA-large' | 'fail';

function rate(ratio: number | null): WcagRating {
  if (ratio == null) return 'fail';
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

function bestForeground(bg: string): { fg: string; ratio: number; rating: WcagRating } {
  const vsWhite = contrastRatio('#ffffff', bg) ?? 0;
  const vsBlack = contrastRatio('#0a0a0a', bg) ?? 0;
  if (vsWhite >= vsBlack) {
    return { fg: '#ffffff', ratio: vsWhite, rating: rate(vsWhite) };
  }
  return { fg: '#0a0a0a', ratio: vsBlack, rating: rate(vsBlack) };
}

function ContrastBadge({ rating, fg }: { rating: WcagRating; fg: string }) {
  if (rating === 'fail') {
    return (
      <div className="font-mono text-[8px] leading-none opacity-60" style={{ color: fg }}>
        —
      </div>
    );
  }
  const label = rating === 'AA-large' ? 'AA+' : rating;
  return (
    <div
      className="rounded-sm px-1 py-[1px] font-mono text-[8px] leading-none font-medium"
      style={{ color: fg, background: 'rgba(255,255,255,0.2)' }}
    >
      {label}
    </div>
  );
}

function ColorSwatches({ colors, isCssVars }: { colors: ColorToken[]; isCssVars: boolean }) {
  const updateColorValue = useTokens((s) => s.updateColorValue);
  const [labelMode, setLabelMode] = useState<'name' | 'oklch'>('name');

  const groups = new Map<string, ColorToken[]>();
  for (const c of colors) {
    const key = c.group ?? c.name.split('-')[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  return (
    <PreviewSection title="Colors" count={colors.length} subtitle="click a swatch to edit · contrast vs best foreground">
      {colors.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-[var(--color-text-muted)]">
            OKLCH = perceptually uniform color space · equal L steps look equally bright
          </span>
          <div className="inline-flex overflow-hidden rounded border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setLabelMode('name')}
              className={`px-1.5 py-0.5 font-mono transition ${
                labelMode === 'name'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              aria-pressed={labelMode === 'name'}
            >
              name
            </button>
            <button
              type="button"
              onClick={() => setLabelMode('oklch')}
              className={`px-1.5 py-0.5 font-mono transition ${
                labelMode === 'oklch'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              aria-pressed={labelMode === 'oklch'}
            >
              oklch
            </button>
          </div>
        </div>
      )}
      {colors.length > 0 ? (
        <div className="space-y-4">
          {[...groups.entries()].map(([group, items]) => {
            const summary = summarizeGroupOklch(items.map((c) => c.value));
            return (
            <div key={group}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  {group}
                </div>
                {summary && summary.isRamp && (
                  <div className="font-mono text-[9px] text-[var(--color-text-muted)] truncate">
                    L {summary.lMax}→{summary.lMin} · C peak {summary.cPeak.toFixed(2)} · H {summary.hue}°
                  </div>
                )}
                {summary && !summary.isRamp && items.length === 1 && (
                  <div className="font-mono text-[9px] text-[var(--color-text-muted)] truncate">
                    {formatOklchShort(items[0].value)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((c, i) => {
                  const { fg, ratio, rating } = bestForeground(c.value);
                  const failing = rating === 'fail' || rating === 'AA-large';
                  const fixHex = failing ? suggestContrastFix(c.value) : null;
                  const oklchShort = formatOklchShort(c.value);
                  const oklchFull = formatOklch(c.value);
                  return (
                    <motion.label
                      key={c.name}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015, duration: 0.18, ease: 'easeOut' }}
                      className="group relative h-14 w-14 cursor-pointer overflow-hidden rounded-md border border-[var(--color-border)] transition hover:scale-105 hover:shadow-md"
                      style={{ background: c.value }}
                      title={`${c.name} · ${c.value} · ${oklchFull} · contrast ${ratio.toFixed(2)}:1 — click to edit`}
                    >
                      <input
                        type="color"
                        value={c.value}
                        onChange={(e) => updateColorValue(c.name, e.target.value)}
                        className="sr-only"
                        aria-label={`Edit ${c.name}`}
                      />
                      <div className="absolute right-1 top-1">
                        <ContrastBadge rating={rating} fg={fg} />
                      </div>
                      <div
                        className="absolute left-1 top-1 rounded-sm px-1 py-[1px] text-[8px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ background: fg === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)', color: fg === '#ffffff' ? '#fff' : '#000' }}
                        aria-hidden
                      >
                        ✎
                      </div>
                      {fixHex && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateColorValue(c.name, fixHex);
                          }}
                          title={`Fix contrast → ${fixHex}`}
                          className="absolute left-1 bottom-6 z-10 rounded-sm px-1 py-[1px] text-[8px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                          style={{
                            background: 'rgba(255,255,255,0.95)',
                            color: '#000',
                          }}
                        >
                          ⚡ fix
                        </button>
                      )}
                      <div
                        className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] font-mono leading-tight"
                        style={{
                          background: fg === '#ffffff' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.65)',
                          color: fg === '#ffffff' ? '#fff' : '#000',
                        }}
                      >
                        {labelMode === 'oklch'
                          ? oklchShort
                          : c.name.length > 10
                            ? c.name.slice(0, 10) + '…'
                            : c.name}
                      </div>
                    </motion.label>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-text-muted)] italic">No colors yet.</div>
      )}
      <AddColorForm isCssVars={isCssVars} />
      <AddPaletteForm isCssVars={isCssVars} />
    </PreviewSection>
  );
}

function SpacingRamp({ spacing, isCssVars }: { spacing: SpacingToken[]; isCssVars: boolean }) {
  const updateSpacingValue = useTokens((s) => s.updateSpacingValue);
  const sorted = [...spacing].sort((a, b) => a.value - b.value);
  const max = sorted.length ? Math.max(...sorted.map((s) => s.value)) : 1;
  const scale = max > 80 ? 80 / max : 1;

  return (
    <PreviewSection title="Spacing" count={spacing.length} subtitle="click a value to edit">
      {spacing.length > 0 ? (
        <div className="space-y-1.5">
          {sorted.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02, duration: 0.18, ease: 'easeOut' }}
              className="flex items-center gap-3 text-xs"
            >
              <div className="w-12 text-right font-mono text-[var(--color-text-muted)] truncate">{s.name}</div>
              <div
                className="h-3 rounded-sm bg-[var(--color-accent)]"
                style={{ width: `${Math.max(s.value * scale, 2)}px` }}
              />
              <EditableNumber
                value={s.value}
                onCommit={(next) => updateSpacingValue(s.name, next)}
                suffix="px"
                step={1}
                min={0}
                label={`${s.name} spacing`}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-text-muted)] italic">No spacings yet.</div>
      )}
      <AddSpacingForm isCssVars={isCssVars} />
    </PreviewSection>
  );
}

function TypeRamp({ typography, isCssVars }: { typography: TypographyToken[]; isCssVars: boolean }) {
  const updateTypographyValue = useTokens((s) => s.updateTypographyValue);
  const sorted = [...typography].sort((a, b) => (b.fontSize ?? 16) - (a.fontSize ?? 16));
  resetSampleSequence();

  return (
    <PreviewSection title="Typography" count={typography.length} subtitle="click any size, weight, line-height, or family to edit">
      {typography.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((t, i) => {
            const sample = sampleTextFor(t);
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mb-0.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  <span className="mr-1">{t.name}</span>
                  {t.fontSize != null && (
                    <EditableNumber
                      value={t.fontSize}
                      onCommit={(next) => updateTypographyValue(t.name, 'fontSize', `${next}px`)}
                      suffix="px"
                      step={1}
                      min={6}
                      max={200}
                      label={`${t.name} font size`}
                    />
                  )}
                  {t.fontWeight != null && (
                    <>
                      <span className="text-[var(--color-text-muted)]/60">·</span>
                      <EditableNumber
                        value={t.fontWeight}
                        onCommit={(next) => updateTypographyValue(t.name, 'fontWeight', String(next))}
                        step={100}
                        min={100}
                        max={900}
                        label={`${t.name} font weight`}
                      />
                    </>
                  )}
                  {t.lineHeight != null && (
                    <>
                      <span className="text-[var(--color-text-muted)]/60">·</span>
                      <span className="lowercase">lh</span>
                      <EditableNumber
                        value={t.lineHeight}
                        onCommit={(next) => updateTypographyValue(t.name, 'lineHeight', String(next))}
                        step={0.1}
                        min={0.8}
                        max={3}
                        decimals={2}
                        label={`${t.name} line height`}
                      />
                    </>
                  )}
                  {t.fontFamily && (
                    <>
                      <span className="text-[var(--color-text-muted)]/60">·</span>
                      <FontPicker
                        value={t.fontFamily}
                        onChange={(opt) => updateTypographyValue(t.name, 'fontFamily', opt.cssValue)}
                      />
                    </>
                  )}
                </div>
                <div
                  className="break-words"
                  style={{
                    fontFamily: t.fontFamily,
                    fontSize: Math.min(t.fontSize ?? 16, 36),
                    fontWeight: t.fontWeight,
                    lineHeight: t.lineHeight,
                  }}
                >
                  {sample}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-text-muted)] italic">No typography yet.</div>
      )}
      <AddTypographyForm isCssVars={isCssVars} />
    </PreviewSection>
  );
}

function ButtonShowcase({
  resolved,
}: {
  resolved: ReturnType<typeof resolveAllRoles>;
}) {
  const { primary, surface, success, warning, danger, info } = resolved;
  if (!primary || !surface) return null;

  const primaryRating = bestForeground(primary.value);
  const surfaceRating = bestForeground(surface.value);

  const semanticBadges = [
    success && { label: 'Active', color: success, key: 'success' },
    info && { label: 'New', color: info, key: 'info' },
    warning && { label: 'Pending', color: warning, key: 'warning' },
    danger && { label: 'Failed', color: danger, key: 'danger' },
  ].filter(Boolean) as { label: string; color: ColorToken; key: string }[];

  const alertColor = warning ?? info;

  return (
    <PreviewSection
      title="Components"
      subtitle="hand-coded UI, painted with your tokens"
    >
      <div className="space-y-3">
        <ComponentBlock name="buttons" label={`buttons · ${primary.name} / ${surface.name}`}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:opacity-90"
              style={{ background: primary.value, color: primaryRating.fg }}
            >
              Primary button
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:opacity-90"
              style={{
                background: surface.value,
                color: surfaceRating.fg,
                borderColor: 'var(--color-border)',
              }}
            >
              Secondary
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-surface)]"
              style={{ color: primary.value }}
            >
              Ghost link →
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium transition hover:opacity-90"
              style={{ background: primary.value, color: primaryRating.fg }}
            >
              sm
            </button>
          </div>
        </ComponentBlock>

        {semanticBadges.length > 0 && (
          <ComponentBlock name="badges" label={`badges · ${semanticBadges.map((b) => b.color.name).join(' / ')}`}>
            <div className="flex flex-wrap gap-1.5">
              {semanticBadges.map((b) => {
                const fg = bestForeground(b.color.value).fg;
                return (
                  <span
                    key={b.key}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: b.color.value, color: fg }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: fg, opacity: 0.7 }} />
                    {b.label}
                  </span>
                );
              })}
              <span
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{ color: primary.value, borderColor: primary.value }}
              >
                Beta
              </span>
            </div>
          </ComponentBlock>
        )}

        <ComponentBlock name="input" label={`input · ${surface.name} bg, border, text`}>
          <div
            className="flex items-center rounded-md border px-2.5 py-1.5"
            style={{ background: surface.value, borderColor: 'var(--color-border)' }}
          >
            <span className="mr-2 text-xs" style={{ color: surfaceRating.fg, opacity: 0.5 }}>
              ⌕
            </span>
            <span className="text-sm" style={{ color: surfaceRating.fg, opacity: 0.6 }}>
              Search tokens…
            </span>
          </div>
        </ComponentBlock>

        {alertColor && (
          <ComponentBlock name="alert" label={`alert · ${alertColor.name}`}>
            <div
              className="flex items-start gap-2 rounded-md border-l-2 px-2.5 py-1.5"
              style={{
                background: surface.value,
                borderLeftColor: alertColor.value,
                color: surfaceRating.fg,
              }}
            >
              <span style={{ color: alertColor.value }}>●</span>
              <div>
                <div className="text-xs font-medium">Heads up</div>
                <div className="text-[11px]" style={{ opacity: 0.7 }}>
                  Your tokens are now in 5 languages. Pick the right tab above to export.
                </div>
              </div>
            </div>
          </ComponentBlock>
        )}

        <ComponentBlock name="card" label={`card · ${surface.name} bg, ${primary.name} accent`}>
          <div
            className="rounded-lg border p-3"
            style={{ background: surface.value, borderColor: 'var(--color-border)' }}
          >
            <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: primary.value }}>
              Featured
            </div>
            <div className="text-sm font-medium" style={{ color: surfaceRating.fg }}>
              A card composed from your tokens
            </div>
            <div className="mt-1 text-xs" style={{ color: surfaceRating.fg, opacity: 0.7 }}>
              Every color here came from the parsed input — nothing is hand-tuned.
            </div>
          </div>
        </ComponentBlock>
      </div>
    </PreviewSection>
  );
}

function ComponentBlock({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
}) {
  const lastEdit = useTokens((s) => s.lastEdit);
  const affected = lastEdit ? lastEdit.affectedBlocks.includes(name) : false;
  const editId = affected ? lastEdit!.id : null;
  const [animateKey, setAnimateKey] = useState<number | null>(null);

  useEffect(() => {
    if (editId !== null) {
      setAnimateKey(editId);
      const t = window.setTimeout(() => setAnimateKey(null), 1000);
      return () => window.clearTimeout(t);
    }
  }, [editId]);

  return (
    <motion.div
      animate={
        animateKey !== null
          ? {
              boxShadow: [
                '0 0 0 0 rgba(216,81,46,0)',
                '0 0 0 3px var(--color-accent-soft)',
                '0 0 0 0 rgba(216,81,46,0)',
              ],
            }
          : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
      }
      transition={{ duration: 1.0, ease: 'easeOut' }}
      className="rounded-md"
    >
      <div className="mb-1.5 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>{label}</span>
        {affected && (
          <motion.span
            initial={{ opacity: 0, x: -2 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-[var(--color-accent)] px-1.5 py-[1px] normal-case tracking-normal text-[var(--color-canvas)]"
          >
            updated
          </motion.span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function PreviewSection({
  title,
  count,
  subtitle,
  children,
}: {
  title: string;
  count?: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm text-[var(--color-text)]">{title}</h3>
        <div className="flex items-baseline gap-2 text-right">
          {subtitle && (
            <span className="text-[10px] text-[var(--color-text-muted)] truncate">{subtitle}</span>
          )}
          {count != null && (
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{count}</span>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export function PreviewPanel() {
  const tokens = useTokens((s) => s.parseResult.tokens);
  const mobileView = useTokens((s) => s.mobileView);
  const previewConfig = useTokens((s) => s.previewConfig);
  const inputFormat = useTokens((s) => s.inputFormat);

  const totalTokens = tokens.colors.length + tokens.spacing.length + tokens.typography.length;
  const visible = mobileView === 'preview';
  const isCssVars = inputFormat === 'css-vars';

  const resolved = resolveAllRoles(tokens.colors, previewConfig);

  return (
    <section
      className={
        (visible ? 'flex' : 'hidden xl:flex') +
        ' h-full min-h-0 min-w-0 flex-col'
      }
    >
      <div className="flex flex-col gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex min-h-[28px] items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Preview</div>
          <div className="font-mono text-[10px] text-[var(--color-text-muted)]">live render</div>
        </div>
        <div className="flex min-h-[18px] items-center">
          <span className="truncate text-xs text-[var(--color-text-muted)]">click any token to edit it live</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-surface)] p-4 scrollbar-thin">
        {totalTokens === 0 && !isCssVars ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-[var(--color-text-muted)]">
            <div>
              <div className="mb-1 font-display text-lg text-[var(--color-text)]">No tokens yet</div>
              <div>Paste tokens, or load a preset from the top right to begin.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {totalTokens > 0 && (
              <>
                <TokenSummary
                  colors={tokens.colors}
                  spacing={tokens.spacing}
                  typography={tokens.typography}
                />
                {tokens.colors.length > 1 && (
                  <AccessibilityMatrix colors={tokens.colors} />
                )}
                {tokens.colors.length > 0 && (
                  <PreviewConfigPanel colors={tokens.colors} resolved={resolved} />
                )}
                <ButtonShowcase resolved={resolved} />
              </>
            )}
            {totalTokens === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-canvas)] p-4 text-center">
                <div className="font-display text-base text-[var(--color-text)]">Build from scratch</div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Add your first color, spacing, or type role below — no code required. The Input editor on the left will fill in as you go.
                </div>
              </div>
            )}
            <ColorSwatches colors={tokens.colors} isCssVars={isCssVars} />
            <TypeRamp typography={tokens.typography} isCssVars={isCssVars} />
            <SpacingRamp spacing={tokens.spacing} isCssVars={isCssVars} />
          </div>
        )}
      </div>
    </section>
  );
}
