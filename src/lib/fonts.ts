export interface FontOption {
  name: string;
  cssName: string;
  cssValue: string;
  category: 'system' | 'sans' | 'serif' | 'display' | 'mono';
  google?: boolean;
}

export const FONTS: FontOption[] = [
  { name: 'System UI', cssName: 'system-ui', cssValue: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', category: 'system' },
  { name: 'Helvetica', cssName: 'Helvetica', cssValue: 'Helvetica, Arial, sans-serif', category: 'system' },
  { name: 'Georgia', cssName: 'Georgia', cssValue: 'Georgia, "Times New Roman", serif', category: 'system' },
  { name: 'Menlo', cssName: 'Menlo', cssValue: 'Menlo, "SF Mono", Consolas, monospace', category: 'system' },

  { name: 'Inter', cssName: 'Inter', cssValue: 'Inter, sans-serif', category: 'sans', google: true },
  { name: 'Roboto', cssName: 'Roboto', cssValue: 'Roboto, sans-serif', category: 'sans', google: true },
  { name: 'Open Sans', cssName: 'Open Sans', cssValue: '"Open Sans", sans-serif', category: 'sans', google: true },
  { name: 'Lato', cssName: 'Lato', cssValue: 'Lato, sans-serif', category: 'sans', google: true },
  { name: 'Manrope', cssName: 'Manrope', cssValue: 'Manrope, sans-serif', category: 'sans', google: true },
  { name: 'Poppins', cssName: 'Poppins', cssValue: 'Poppins, sans-serif', category: 'sans', google: true },
  { name: 'IBM Plex Sans', cssName: 'IBM Plex Sans', cssValue: '"IBM Plex Sans", sans-serif', category: 'sans', google: true },
  { name: 'DM Sans', cssName: 'DM Sans', cssValue: '"DM Sans", sans-serif', category: 'sans', google: true },

  { name: 'Playfair Display', cssName: 'Playfair Display', cssValue: '"Playfair Display", serif', category: 'serif', google: true },
  { name: 'Merriweather', cssName: 'Merriweather', cssValue: 'Merriweather, serif', category: 'serif', google: true },
  { name: 'EB Garamond', cssName: 'EB Garamond', cssValue: '"EB Garamond", serif', category: 'serif', google: true },
  { name: 'Instrument Serif', cssName: 'Instrument Serif', cssValue: '"Instrument Serif", serif', category: 'serif', google: true },
  { name: 'Lora', cssName: 'Lora', cssValue: 'Lora, serif', category: 'serif', google: true },

  { name: 'Bebas Neue', cssName: 'Bebas Neue', cssValue: '"Bebas Neue", sans-serif', category: 'display', google: true },
  { name: 'Anton', cssName: 'Anton', cssValue: 'Anton, sans-serif', category: 'display', google: true },
  { name: 'Oswald', cssName: 'Oswald', cssValue: 'Oswald, sans-serif', category: 'display', google: true },

  { name: 'JetBrains Mono', cssName: 'JetBrains Mono', cssValue: '"JetBrains Mono", monospace', category: 'mono', google: true },
  { name: 'Fira Code', cssName: 'Fira Code', cssValue: '"Fira Code", monospace', category: 'mono', google: true },
  { name: 'Source Code Pro', cssName: 'Source Code Pro', cssValue: '"Source Code Pro", monospace', category: 'mono', google: true },
];

const loaded = new Set<string>();

export function loadGoogleFont(name: string): void {
  if (typeof document === 'undefined') return;
  if (loaded.has(name)) return;
  loaded.add(name);

  const id = `tk-font-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const familyParam = name.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function preloadAllGoogleFonts(): void {
  for (const f of FONTS) {
    if (f.google) loadGoogleFont(f.name);
  }
}

export function findFontByValue(value: string | undefined): FontOption | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return (
    FONTS.find((f) => normalized === f.cssValue.toLowerCase()) ??
    FONTS.find((f) => normalized.startsWith(f.cssName.toLowerCase().replace(/"/g, ''))) ??
    FONTS.find((f) => normalized.includes(f.cssName.toLowerCase().replace(/"/g, ''))) ??
    null
  );
}

export const CATEGORY_ORDER: Array<FontOption['category']> = ['system', 'sans', 'serif', 'display', 'mono'];

export const CATEGORY_LABEL: Record<FontOption['category'], string> = {
  system: 'System',
  sans: 'Sans-serif',
  serif: 'Serif',
  display: 'Display',
  mono: 'Mono',
};
