import { create } from 'zustand';
import type { NamingConvention, ParseResult, TokenFormat, TokenSet } from '../lib/types';
import { FORMATS, emptyTokenSet } from '../lib/types';
import { parse } from '../lib/parsers';
import { serialize } from '../lib/serializers';
import { PRESETS } from '../lib/presets';
import { detectFormat } from '../lib/format-detect';
import { loadJson, loadString, saveJson, saveString } from '../lib/storage';
import { readShareFromUrl, buildShareUrl } from '../lib/share';
import { downloadText, mimeForExt } from '../lib/download';
import {
  appendColor,
  appendColors,
  appendSpacing,
  appendTypography,
  replaceColorValue,
  replaceSpacingValue,
  replaceTypographyValue,
  type AppendableTypographyProps,
  type TypographyProperty,
} from '../lib/source-edit';
import { generatePalette } from '../lib/palette';
import { computeImpact } from '../lib/preview-roles';

const DEFAULT_PRESET = PRESETS[0];

export type Theme = 'light' | 'dark';
export type MobileView = 'input' | 'output' | 'preview';
export type PreviewRole = 'primary' | 'surface' | 'success' | 'warning' | 'danger' | 'info';
export type PreviewConfig = Partial<Record<PreviewRole, string>>;

export interface ToastState {
  id: number;
  message: string;
  detail?: string;
  kind?: 'success' | 'info' | 'error';
}

export interface EditPulse {
  id: number;
  tokenName: string;
  affectedBlocks: string[];
  changedLines: number[];
  newValue: string;
  prevTokens: TokenSet;
  timestamp: number;
}

interface TokensState {
  input: string;
  inputFormat: TokenFormat;
  manualFormat: boolean;
  parseResult: ParseResult;
  naming: NamingConvention;
  theme: Theme;
  activeOutput: TokenFormat;
  mobileView: MobileView;
  helpOpen: boolean;
  introDismissed: boolean;
  toast: ToastState | null;
  previewConfig: PreviewConfig;
  previewConfigOpen: boolean;
  lastEdit: EditPulse | null;

  setInput: (value: string) => void;
  setInputFormat: (format: TokenFormat) => void;
  setNaming: (naming: NamingConvention) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setActiveOutput: (format: TokenFormat) => void;
  setMobileView: (view: MobileView) => void;
  loadPreset: (id: string) => void;
  cycleNextPreset: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  dismissIntro: () => void;
  restoreIntro: () => void;
  resetToDefault: () => void;

  setPreviewRole: (role: PreviewRole, name: string | null) => void;
  togglePreviewConfig: () => void;
  resetPreviewConfig: () => void;
  updateColorValue: (tokenName: string, newValue: string) => void;
  updateTypographyValue: (tokenName: string, propType: TypographyProperty, newValue: string) => void;
  updateSpacingValue: (tokenName: string, newValueInPx: number) => void;

  addColor: (name: string, value: string) => void;
  addPalette: (prefix: string, baseHex: string) => void;
  addSpacing: (name: string, valueInPx: number) => void;
  addTypography: (name: string, props: AppendableTypographyProps) => void;

  showToast: (message: string, kind?: ToastState['kind'], detail?: string) => void;
  clearToast: () => void;

  shareUrl: () => Promise<void>;
  copyOutput: () => Promise<void>;
  downloadOutput: () => void;
}

function reparse(input: string, format: TokenFormat): ParseResult {
  return parse(input, format);
}

function detectInitialTheme(): Theme {
  const stored = loadString('theme', '');
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

const fromShare = readShareFromUrl();
const initialInputRaw = fromShare?.input ?? loadString('input', DEFAULT_PRESET.source);
const initialInput = initialInputRaw.trim() ? initialInputRaw : DEFAULT_PRESET.source;
const initialFormat = fromShare?.inputFormat ?? loadJson<TokenFormat>('inputFormat', DEFAULT_PRESET.format);
const initialNaming = fromShare?.naming ?? loadJson<NamingConvention>('naming', 'kebab-case');
const initialActiveOutput = fromShare?.activeOutput ?? loadJson<TokenFormat>('activeOutput', 'css-vars');
const initialIntroDismissed = loadJson<boolean>('introDismissed', false);
const initialTheme = fromShare?.theme ?? detectInitialTheme();
const initialPreviewConfig = loadJson<PreviewConfig>('previewConfig', {});
const initialPreviewConfigOpen = loadJson<boolean>('previewConfigOpen', false);

if (fromShare && typeof window !== 'undefined') {
  history.replaceState(null, '', window.location.pathname);
}

function diffLineNumbers(oldText: string, newText: string): number[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const changed: number[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) changed.push(i + 1);
  }
  return changed;
}

let toastIdCounter = 1;

export const useTokens = create<TokensState>((set, get) => ({
  input: initialInput,
  inputFormat: initialFormat,
  manualFormat: false,
  parseResult: reparse(initialInput, initialFormat),
  naming: initialNaming,
  theme: initialTheme,
  activeOutput: initialActiveOutput,
  mobileView: 'input',
  helpOpen: false,
  introDismissed: initialIntroDismissed,
  toast: null,
  previewConfig: initialPreviewConfig,
  previewConfigOpen: initialPreviewConfigOpen,
  lastEdit: null,

  setInput: (value: string) => {
    const state = get();
    let format = state.inputFormat;
    if (!state.manualFormat) {
      const detected = detectFormat(value);
      if (detected) format = detected;
    }
    const changed = format !== state.inputFormat && !state.manualFormat;
    saveString('input', value);
    saveJson('inputFormat', format);
    set({
      input: value,
      inputFormat: format,
      parseResult: reparse(value, format),
    });
    if (changed) {
      const label = format === 'css-vars' ? 'CSS Variables' : format === 'tailwind' ? 'Tailwind' : 'Style Dictionary';
      get().showToast(`Detected: ${label}`, 'info');
    }
  },

  setInputFormat: (format) => {
    saveJson('inputFormat', format);
    set({
      inputFormat: format,
      manualFormat: true,
      parseResult: reparse(get().input, format),
    });
  },

  setNaming: (naming) => {
    saveJson('naming', naming);
    set({ naming });
  },

  setTheme: (theme) => {
    saveString('theme', theme);
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setActiveOutput: (format) => {
    saveJson('activeOutput', format);
    set({ activeOutput: format });
  },

  setMobileView: (view) => set({ mobileView: view }),

  resetToDefault: () => {
    const preset = PRESETS[0];
    saveString('input', preset.source);
    saveJson('inputFormat', preset.format);
    set({
      input: preset.source,
      inputFormat: preset.format,
      manualFormat: false,
      parseResult: reparse(preset.source, preset.format),
    });
    get().showToast(`Loaded: ${preset.label}`, 'success');
  },

  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    saveString('input', preset.source);
    saveJson('inputFormat', preset.format);
    set({
      input: preset.source,
      inputFormat: preset.format,
      manualFormat: false,
      parseResult: reparse(preset.source, preset.format),
    });
    get().showToast(`Loaded: ${preset.label}`, 'success');
  },

  cycleNextPreset: () => {
    const current = get().input;
    const currentIdx = PRESETS.findIndex((p) => p.source === current);
    const next = PRESETS[(currentIdx + 1) % PRESETS.length];
    get().loadPreset(next.id);
  },

  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  toggleHelp: () => set({ helpOpen: !get().helpOpen }),

  dismissIntro: () => {
    saveJson('introDismissed', true);
    set({ introDismissed: true });
  },

  restoreIntro: () => {
    saveJson('introDismissed', false);
    set({ introDismissed: false });
  },

  showToast: (message, kind = 'info', detail) => {
    toastIdCounter += 1;
    set({ toast: { id: toastIdCounter, message, kind, detail } });
  },

  clearToast: () => set({ toast: null }),

  shareUrl: async () => {
    const s = get();
    const url = buildShareUrl({
      input: s.input,
      inputFormat: s.inputFormat,
      naming: s.naming,
      activeOutput: s.activeOutput,
      theme: s.theme,
    });
    try {
      await navigator.clipboard.writeText(url);
      get().showToast('Share link copied', 'success');
    } catch {
      get().showToast('Could not copy link', 'error');
    }
  },

  copyOutput: async () => {
    const s = get();
    const text = serialize(s.parseResult.tokens, s.activeOutput, s.naming);
    try {
      await navigator.clipboard.writeText(text);
      get().showToast('Output copied', 'success');
    } catch {
      get().showToast('Could not copy', 'error');
    }
  },

  downloadOutput: () => {
    const s = get();
    const text = serialize(s.parseResult.tokens, s.activeOutput, s.naming);
    const meta = FORMATS[s.activeOutput];
    const filename = `tokens.${meta.fileExt}`;
    downloadText(filename, text, mimeForExt(meta.fileExt));
    get().showToast(`Downloaded ${filename}`, 'success');
  },

  setPreviewRole: (role, name) => {
    const next = { ...get().previewConfig };
    if (name === null) {
      delete next[role];
    } else {
      next[role] = name;
    }
    saveJson('previewConfig', next);
    set({ previewConfig: next });
  },

  togglePreviewConfig: () => {
    const next = !get().previewConfigOpen;
    saveJson('previewConfigOpen', next);
    set({ previewConfigOpen: next });
  },

  resetPreviewConfig: () => {
    saveJson('previewConfig', {});
    set({ previewConfig: {} });
    get().showToast('Preview reset to auto', 'success');
  },

  updateColorValue: (tokenName, newValue) => {
    const state = get();
    const oldValue = state.parseResult.tokens.colors.find((c) => c.name === tokenName)?.value;
    const newSource = replaceColorValue(state.input, state.inputFormat, tokenName, newValue);
    if (newSource === null) {
      get().showToast(`Couldn't find "${tokenName}" in source to update`, 'error');
      return;
    }
    if (newSource === state.input) return;

    const newParse = reparse(newSource, state.inputFormat);
    const impact = computeImpact(tokenName, newParse.tokens.colors, state.previewConfig);
    const changedLines = diffLineNumbers(state.input, newSource);

    saveString('input', newSource);

    toastIdCounter += 1;
    const message =
      oldValue && oldValue.toLowerCase() !== newValue.toLowerCase()
        ? `${tokenName}  ${oldValue} → ${newValue}`
        : `Updated ${tokenName}`;

    const linesLabel = `${changedLines.length} line${changedLines.length === 1 ? '' : 's'} in input`;
    let detail: string;
    if (impact.components.length > 0) {
      const first = impact.components.slice(0, 2).join(', ');
      const more = impact.components.length > 2 ? ` + ${impact.components.length - 2} more` : '';
      detail = `Repainted ${first}${more} · ${linesLabel} · all 5 outputs regenerated`;
    } else {
      detail = `${linesLabel} · all 5 outputs regenerated`;
    }

    set({
      input: newSource,
      parseResult: newParse,
      toast: { id: toastIdCounter, message, detail, kind: 'success' },
      lastEdit: {
        id: toastIdCounter,
        tokenName,
        affectedBlocks: impact.blocks,
        changedLines,
        newValue,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  updateTypographyValue: (tokenName, propType, newValue) => {
    const state = get();
    const newSource = replaceTypographyValue(state.input, state.inputFormat, tokenName, propType, newValue);
    if (newSource === null) {
      get().showToast(`Couldn't find ${propType} for "${tokenName}" in source`, 'error');
      return;
    }
    if (newSource === state.input) return;

    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);

    saveString('input', newSource);

    toastIdCounter += 1;
    const propLabel =
      propType === 'fontSize'
        ? 'size'
        : propType === 'fontWeight'
          ? 'weight'
          : propType === 'lineHeight'
            ? 'line-height'
            : 'family';
    const linesLabel = `${changedLines.length} line${changedLines.length === 1 ? '' : 's'} in input`;

    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `${tokenName} ${propLabel} → ${newValue}`,
        detail: `${linesLabel} · all 5 outputs regenerated`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName: `${tokenName}.${propType}`,
        affectedBlocks: [],
        changedLines,
        newValue,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  updateSpacingValue: (tokenName, newValueInPx) => {
    const state = get();
    const newSource = replaceSpacingValue(state.input, state.inputFormat, tokenName, newValueInPx);
    if (newSource === null) {
      get().showToast(`Couldn't find "${tokenName}" in source`, 'error');
      return;
    }
    if (newSource === state.input) return;

    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);

    saveString('input', newSource);

    toastIdCounter += 1;
    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `${tokenName} → ${newValueInPx}px`,
        detail: `${changedLines.length} line${changedLines.length === 1 ? '' : 's'} in input · all 5 outputs regenerated`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName,
        affectedBlocks: [],
        changedLines,
        newValue: `${newValueInPx}px`,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  addColor: (name, value) => {
    const state = get();
    const newSource = appendColor(state.input, state.inputFormat, name, value);
    if (newSource === null) {
      get().showToast(`Adding tokens needs CSS Variables format (currently ${state.inputFormat})`, 'error');
      return;
    }
    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);
    saveString('input', newSource);
    toastIdCounter += 1;
    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `Added color ${name}`,
        detail: `${value} · ${changedLines.length} line${changedLines.length === 1 ? '' : 's'} added`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName: name,
        affectedBlocks: [],
        changedLines,
        newValue: value,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  addPalette: (prefix, baseHex) => {
    const state = get();
    const entries = generatePalette(prefix, baseHex);
    if (entries.length === 0) {
      get().showToast(`Couldn't generate a scale from ${baseHex}`, 'error');
      return;
    }
    const newSource = appendColors(state.input, state.inputFormat, entries);
    if (newSource === null) {
      get().showToast(`Adding tokens needs CSS Variables format (currently ${state.inputFormat})`, 'error');
      return;
    }
    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);
    saveString('input', newSource);
    toastIdCounter += 1;
    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `Generated ${prefix} scale (${entries.length} colors)`,
        detail: `${entries[0].value} → … → ${entries[entries.length - 1].value} · ${changedLines.length} lines added`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName: `${prefix}-500`,
        affectedBlocks: [],
        changedLines,
        newValue: baseHex,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  addSpacing: (name, valueInPx) => {
    const state = get();
    const newSource = appendSpacing(state.input, state.inputFormat, name, valueInPx);
    if (newSource === null) {
      get().showToast(`Adding tokens needs CSS Variables format (currently ${state.inputFormat})`, 'error');
      return;
    }
    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);
    saveString('input', newSource);
    toastIdCounter += 1;
    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `Added spacing ${name}`,
        detail: `${valueInPx}px · ${changedLines.length} line${changedLines.length === 1 ? '' : 's'} added`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName: name,
        affectedBlocks: [],
        changedLines,
        newValue: `${valueInPx}px`,
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },

  addTypography: (name, props) => {
    const state = get();
    const newSource = appendTypography(state.input, state.inputFormat, name, props);
    if (newSource === null) {
      get().showToast(`Adding tokens needs CSS Variables format (currently ${state.inputFormat})`, 'error');
      return;
    }
    const newParse = reparse(newSource, state.inputFormat);
    const changedLines = diffLineNumbers(state.input, newSource);
    saveString('input', newSource);
    toastIdCounter += 1;
    const detailBits: string[] = [];
    if (props.fontFamily) detailBits.push(props.fontFamily.split(',')[0].replace(/['"]/g, ''));
    if (props.fontSize) detailBits.push(`${props.fontSize}px`);
    if (props.fontWeight) detailBits.push(`weight ${props.fontWeight}`);
    if (props.lineHeight) detailBits.push(`lh ${props.lineHeight}`);
    set({
      input: newSource,
      parseResult: newParse,
      toast: {
        id: toastIdCounter,
        message: `Added type role ${name}`,
        detail: `${detailBits.join(' · ')} · ${changedLines.length} lines added`,
        kind: 'success',
      },
      lastEdit: {
        id: toastIdCounter,
        tokenName: name,
        affectedBlocks: [],
        changedLines,
        newValue: detailBits.join(' '),
        prevTokens: state.parseResult.tokens,
        timestamp: Date.now(),
      },
    });
  },
}));

export function getEmptyTokens() {
  return emptyTokenSet();
}
