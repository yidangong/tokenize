import { useTokens } from '../store/tokens';

export function IntroBanner() {
  const introDismissed = useTokens((s) => s.introDismissed);
  const dismissIntro = useTokens((s) => s.dismissIntro);
  const openHelp = useTokens((s) => s.openHelp);

  if (introDismissed) return null;

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-accent-soft)]/40">
      <div className="flex flex-col items-start gap-2 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-display text-base text-[var(--color-text)]">
            You designed it once. Now you're retyping it everywhere.
          </span>
          <span className="text-[var(--color-text-muted)]">
            Tokenize moves your colors, type, and spacing between every format your team ships to — CSS, Tailwind, iOS, Android, Style Dictionary. In a browser, no install.
          </span>
          <button
            type="button"
            onClick={openHelp}
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Learn more →
          </button>
        </div>
        <button
          type="button"
          onClick={dismissIntro}
          aria-label="Dismiss intro"
          className="shrink-0 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-text)] transition"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  );
}
