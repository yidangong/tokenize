import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useTokens } from '../store/tokens';

export function Toast() {
  const toast = useTokens((s) => s.toast);
  const clearToast = useTokens((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.detail ? 3600 : 2400;
    const id = window.setTimeout(() => clearToast(), duration);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  return (
    <div className="pointer-events-none fixed bottom-12 left-1/2 z-50 -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            className="pointer-events-auto max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2 text-xs text-[var(--color-text)] shadow-lg"
          >
            <div className="flex items-baseline gap-1.5">
              <span
                className={
                  toast.kind === 'success'
                    ? 'text-[var(--color-accent)]'
                    : toast.kind === 'error'
                      ? 'text-red-500'
                      : 'text-[var(--color-text-muted)]'
                }
                aria-hidden
              >
                {toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '⚠' : 'ℹ'}
              </span>
              <span className="font-medium">{toast.message}</span>
            </div>
            {toast.detail && (
              <div className="mt-0.5 pl-4 text-[11px] text-[var(--color-text-muted)]">
                {toast.detail}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
