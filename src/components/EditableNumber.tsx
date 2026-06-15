import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  onCommit: (next: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  label?: string;
}

export function EditableNumber({
  value,
  onCommit,
  suffix = '',
  step = 1,
  min,
  max,
  decimals = 0,
  label,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, value]);

  const commit = () => {
    const num = Number(draft);
    if (!Number.isNaN(num) && num !== value) {
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
      onCommit(clamped);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        step={step}
        min={min}
        max={max}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className="inline-block w-14 rounded border border-[var(--color-accent)] bg-[var(--color-canvas)] px-1 py-[1px] font-mono text-[10px] text-[var(--color-text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label={label}
      />
    );
  }

  const display = decimals > 0 ? value.toFixed(decimals) : value;

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={label ? `Click to edit ${label}` : 'Click to edit'}
      className="inline-block rounded px-1 py-[1px] font-mono text-[10px] tabular-nums text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
    >
      {display}
      {suffix}
    </button>
  );
}
