export function Footer() {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-2 text-xs text-[var(--color-text-muted)]">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm text-[var(--color-text)]">Tokenize</span>
        <span className="text-[var(--color-border)]" aria-hidden>·</span>
        <span>
          Designed &amp; built by{' '}
          <a
            href="https://github.com/eedan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text)] underline-offset-2 hover:underline"
          >
            eedan
          </a>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/eedan/tokenize"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-text)] transition"
        >
          GitHub ↗
        </a>
        <span className="hidden sm:inline">v0.1 · MIT</span>
      </div>
    </footer>
  );
}
