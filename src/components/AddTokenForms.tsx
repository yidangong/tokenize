import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTokens } from '../store/tokens';
import { FontPicker } from './FontPicker';
import { findFontByValue } from '../lib/fonts';
import { generatePalette } from '../lib/palette';

interface AddRowProps {
  label: string;
  cssRequired: boolean;
  isCssVars: boolean;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function AddRow({ label, cssRequired, isCssVars, expanded, onToggle, children }: AddRowProps) {
  const disabled = cssRequired && !isCssVars;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          onToggle();
        }}
        disabled={disabled}
        className={
          'w-full rounded-md border border-dashed px-2.5 py-1.5 text-xs transition ' +
          (disabled
            ? 'cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-muted)]/60'
            : expanded
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/40 text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]')
        }
        title={disabled ? 'Switch the input to CSS Variables to add new tokens' : `Add a new ${label.toLowerCase()}`}
      >
        {disabled
          ? `+ ${label} — switch to CSS Variables to enable`
          : expanded
            ? `× cancel`
            : `+ ${label}`}
      </button>
      <AnimatePresence initial={false}>
        {expanded && !disabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AddColorForm({ isCssVars }: { isCssVars: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#5b21b6');
  const addColor = useTokens((s) => s.addColor);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (expanded) requestAnimationFrame(() => nameRef.current?.focus());
  }, [expanded]);

  const submit = () => {
    if (!name.trim()) return;
    addColor(name.trim().toLowerCase().replace(/\s+/g, '-'), hex);
    setName('');
    setHex('#5b21b6');
    setExpanded(false);
  };

  return (
    <AddRow
      label="Add color"
      cssRequired
      isCssVars={isCssVars}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={nameRef}
          type="text"
          placeholder="name (e.g. brand-primary)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <label
          className="block h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded border border-[var(--color-border)]"
          style={{ background: hex }}
          title={`Pick color (currently ${hex})`}
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="sr-only"
          />
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-[var(--color-text)] px-2.5 py-1 text-xs text-[var(--color-canvas)] transition hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </AddRow>
  );
}

export function AddPaletteForm({ isCssVars }: { isCssVars: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [baseHex, setBaseHex] = useState('#7c3aed');
  const addPalette = useTokens((s) => s.addPalette);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (expanded) requestAnimationFrame(() => nameRef.current?.focus());
  }, [expanded]);

  const preview = useMemo(() => generatePalette(prefix || 'preview', baseHex), [prefix, baseHex]);

  const submit = () => {
    if (!prefix.trim()) return;
    addPalette(prefix.trim().toLowerCase().replace(/\s+/g, '-'), baseHex);
    setPrefix('');
    setBaseHex('#7c3aed');
    setExpanded(false);
  };

  return (
    <AddRow
      label="✨ Generate scale (50–950)"
      cssRequired
      isCssVars={isCssVars}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <input
            ref={nameRef}
            type="text"
            placeholder="prefix (e.g. brand → brand-50, brand-100, …)"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <label
            className="block h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded border border-[var(--color-border)]"
            style={{ background: baseHex }}
            title={`Base color (currently ${baseHex} — acts as the 500 step)`}
          >
            <input
              type="color"
              value={baseHex}
              onChange={(e) => setBaseHex(e.target.value)}
              className="sr-only"
            />
          </label>
          <button
            type="submit"
            disabled={!prefix.trim() || preview.length === 0}
            className="rounded-md bg-[var(--color-text)] px-2.5 py-1 text-xs text-[var(--color-canvas)] transition hover:opacity-90 disabled:opacity-40"
          >
            Generate
          </button>
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>Live preview · OKLCH</span>
            <span className="normal-case tracking-normal">11 perceptually-uniform steps</span>
          </div>
          <div className="flex h-7 overflow-hidden rounded border border-[var(--color-border)]">
            {preview.map((p) => (
              <div
                key={p.step}
                className="relative flex-1"
                style={{ background: p.value }}
                title={`${prefix || 'preview'}-${p.step} · ${p.value}`}
              >
                <div className="absolute inset-x-0 bottom-0 text-center font-mono text-[8px] text-white mix-blend-difference">
                  {p.step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </AddRow>
  );
}

export function AddSpacingForm({ isCssVars }: { isCssVars: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [px, setPx] = useState(8);
  const addSpacing = useTokens((s) => s.addSpacing);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (expanded) requestAnimationFrame(() => nameRef.current?.focus());
  }, [expanded]);

  const submit = () => {
    if (!name.trim() || px < 0) return;
    addSpacing(name.trim().toLowerCase().replace(/\s+/g, '-'), px);
    setName('');
    setPx(8);
    setExpanded(false);
  };

  return (
    <AddRow
      label="Add spacing"
      cssRequired
      isCssVars={isCssVars}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={nameRef}
          type="text"
          placeholder="name (e.g. md or 4)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <input
          type="number"
          min={0}
          step={1}
          value={px}
          onChange={(e) => setPx(Number(e.target.value))}
          className="w-16 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <span className="font-mono text-xs text-[var(--color-text-muted)]">px</span>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-[var(--color-text)] px-2.5 py-1 text-xs text-[var(--color-canvas)] transition hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </AddRow>
  );
}

export function AddTypographyForm({ isCssVars }: { isCssVars: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const addTypography = useTokens((s) => s.addTypography);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (expanded) requestAnimationFrame(() => nameRef.current?.focus());
  }, [expanded]);

  const submit = () => {
    if (!name.trim()) return;
    addTypography(name.trim().toLowerCase().replace(/\s+/g, '-'), {
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
    });
    setName('');
    setFontSize(16);
    setFontWeight(400);
    setLineHeight(1.5);
    setFontFamily('Inter, sans-serif');
    setExpanded(false);
  };

  return (
    <AddRow
      label="Add type role"
      cssRequired
      isCssVars={isCssVars}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <input
            ref={nameRef}
            type="text"
            placeholder="role name (e.g. heading, body, caption)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md bg-[var(--color-text)] px-2.5 py-1 text-xs text-[var(--color-canvas)] transition hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <FieldLabel label="size">
            <input
              type="number"
              min={6}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </FieldLabel>
          <FieldLabel label="weight">
            <input
              type="number"
              min={100}
              max={900}
              step={100}
              value={fontWeight}
              onChange={(e) => setFontWeight(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </FieldLabel>
          <FieldLabel label="line-height">
            <input
              type="number"
              min={0.8}
              max={3}
              step={0.1}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </FieldLabel>
          <FieldLabel label="family">
            <FontPicker
              value={fontFamily}
              onChange={(opt) => setFontFamily(opt.cssValue)}
            />
          </FieldLabel>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">
          Preview: <span style={{ fontFamily, fontSize: Math.min(fontSize, 28), fontWeight, lineHeight }}>{findFontByValue(fontFamily)?.name ?? 'Inter'} · {fontSize}px</span>
        </div>
      </form>
    </AddRow>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
