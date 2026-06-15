import { useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { IntroBanner } from './components/IntroBanner';
import { HelpDialog } from './components/HelpDialog';
import { Footer } from './components/Footer';
import { MobileTabs } from './components/MobileTabs';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Toast } from './components/Toast';
import { useTokens } from './store/tokens';
import { useShortcuts } from './lib/shortcuts';

function App() {
  const theme = useTokens((s) => s.theme);
  const toggleHelp = useTokens((s) => s.toggleHelp);
  const closeHelp = useTokens((s) => s.closeHelp);
  const toggleTheme = useTokens((s) => s.toggleTheme);
  const cycleNextPreset = useTokens((s) => s.cycleNextPreset);
  const copyOutput = useTokens((s) => s.copyOutput);
  const shareUrl = useTokens((s) => s.shareUrl);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const shortcuts = useMemo(
    () => [
      { key: 'k', meta: true, handler: () => toggleHelp() },
      { key: 'c', meta: true, shift: true, handler: () => void copyOutput() },
      { key: 's', meta: true, shift: true, handler: () => void shareUrl() },
      { key: 'd', meta: true, shift: true, handler: () => toggleTheme() },
      { key: 'l', meta: true, shift: true, handler: () => cycleNextPreset() },
      { key: 'Escape', meta: false, ignoreInEditor: true, handler: () => closeHelp() },
    ],
    [toggleHelp, copyOutput, shareUrl, toggleTheme, cycleNextPreset, closeHelp]
  );
  useShortcuts(shortcuts);

  return (
    <div className="flex h-screen w-screen flex-col bg-[var(--color-canvas)] text-[var(--color-text)]">
      <Header />
      <IntroBanner />
      <MobileTabs />

      <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 xl:grid-cols-3">
        <InputPanel />
        <OutputPanel />
        <PreviewPanel />
      </main>

      <Footer />
      <HelpDialog />
      <Toast />
    </div>
  );
}

export default App;
