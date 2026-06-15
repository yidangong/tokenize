import * as Dialog from '@radix-ui/react-dialog';
import { useTokens } from '../store/tokens';

export function HelpDialog() {
  const helpOpen = useTokens((s) => s.helpOpen);
  const closeHelp = useTokens((s) => s.closeHelp);
  const loadPreset = useTokens((s) => s.loadPreset);

  return (
    <Dialog.Root open={helpOpen} onOpenChange={(open) => (open ? null : closeHelp())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-6 shadow-2xl scrollbar-thin"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title asChild>
              <h2 className="font-display text-2xl text-[var(--color-text)]">
                What is Tokenize?
              </h2>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition"
              >
                <span className="text-xl leading-none" aria-hidden>×</span>
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-5 text-[var(--color-text-muted)] leading-relaxed">
            <strong className="text-[var(--color-text)]">You designed it once. You shouldn't have to retype it everywhere.</strong> Tokenize moves your colors, type, and spacing between every format your team ships to — CSS Variables, Tailwind, iOS Swift, Android XML, Style Dictionary, Figma Variables. Tools like Style Dictionary and Tokens Studio are great if you have a design systems engineer with a weekend to set them up; if you don't — solo designer, two-person startup, freelance engineer prepping a Figma handoff — Tokenize is the in-between. Paste any format, edit by clicking, export anywhere — in a browser, no install.
          </Dialog.Description>

          <div className="mb-5 space-y-3">
            <Step
              n={1}
              title="Paste or load a preset"
              body="Paste tokens you already have — CSS Variables, Tailwind config, Style Dictionary JSON, or a Figma Variables export. Format auto-detects — no config file required."
            />
            <Step
              n={2}
              title="Edit live"
              body="Click any swatch, font size, weight, line-height, family, or spacing value to edit — no code required. Inputs and outputs stay in sync. Pasted source formatting is preserved."
            />
            <Step
              n={3}
              title="Export anywhere"
              body="Outputs regenerate live in six languages: CSS Variables, Tailwind v3 / v4, Style Dictionary (legacy + W3C DTCG), iOS Swift, and Android XML. Copy, download, or share the whole state via URL — no account, no backend."
            />
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-muted)]">
            <div className="mb-1 font-medium text-[var(--color-text)]">Try an example</div>
            <div className="flex flex-wrap gap-2">
              <ExampleButton id="tailwind-default" label="Tailwind essentials" onClick={(id) => { loadPreset(id); closeHelp(); }} />
              <ExampleButton id="radix-colors" label="Radix Colors" onClick={(id) => { loadPreset(id); closeHelp(); }} />
              <ExampleButton id="material-3" label="Material 3" onClick={(id) => { loadPreset(id); closeHelp(); }} />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-muted)]">
            <div className="mb-2 font-medium text-[var(--color-text)]">Keyboard shortcuts</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <Shortcut keys="⌘K" label="Open / close this help" />
              <Shortcut keys="⌘⇧C" label="Copy active output" />
              <Shortcut keys="⌘⇧S" label="Copy share link" />
              <Shortcut keys="⌘⇧D" label="Toggle dark mode" />
              <Shortcut keys="⌘⇧L" label="Cycle to next preset" />
              <Shortcut keys="Esc" label="Close dialog" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Your work is auto-saved to this browser.</span>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md bg-[var(--color-text)] px-3 py-1.5 text-sm text-[var(--color-canvas)] hover:opacity-90 transition"
              >
                Got it
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-xs text-[var(--color-text-muted)]">
        {n}
      </div>
      <div>
        <div className="font-medium text-[var(--color-text)]">{title}</div>
        <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function ExampleButton({ id, label, onClick }: { id: string; label: string; onClick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition"
    >
      {label} →
    </button>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text)] shadow-sm">
        {keys}
      </kbd>
    </div>
  );
}
