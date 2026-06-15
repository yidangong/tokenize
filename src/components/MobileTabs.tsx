import { useTokens, type MobileView } from '../store/tokens';

const TABS: { id: MobileView; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'output', label: 'Output' },
  { id: 'preview', label: 'Preview' },
];

export function MobileTabs() {
  const mobileView = useTokens((s) => s.mobileView);
  const setMobileView = useTokens((s) => s.setMobileView);

  return (
    <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] xl:hidden">
      {TABS.map((t) => {
        const active = mobileView === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileView(t.id)}
            className={
              'relative flex-1 px-3 py-2 text-sm font-medium transition ' +
              (active
                ? 'text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
            }
            aria-pressed={active}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-[2px] bg-[var(--color-text)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
