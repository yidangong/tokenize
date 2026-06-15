import type { ParseResult, TokenSet, TypographyToken } from '../types';
import { emptyTokenSet } from '../types';
import { normalizeColor, pxFromCss } from '../util';

const VAR_RE = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;

const FONT_SIZE_HINTS = ['font-size', 'fontsize', 'text', 'size'];
const FONT_WEIGHT_HINTS = ['font-weight', 'fontweight', 'weight'];
const LINE_HEIGHT_HINTS = ['line-height', 'lineheight', 'leading'];
const FONT_FAMILY_HINTS = ['font-family', 'fontfamily', 'font'];

function categorize(name: string): 'color' | 'spacing' | 'font-size' | 'font-weight' | 'line-height' | 'font-family' | 'unknown' {
  const n = name.toLowerCase();
  if (FONT_SIZE_HINTS.some((h) => n.includes(h))) return 'font-size';
  if (FONT_WEIGHT_HINTS.some((h) => n.includes(h))) return 'font-weight';
  if (LINE_HEIGHT_HINTS.some((h) => n.includes(h))) return 'line-height';
  if (FONT_FAMILY_HINTS.some((h) => n.includes(h))) return 'font-family';
  if (/color|bg|background|fg|foreground|text|fill|stroke|border|surface|accent|brand|primary|secondary|tertiary|neutral|gray|grey|red|orange|yellow|green|blue|indigo|violet|purple|pink|rose|amber|lime|emerald|teal|cyan|sky|fuchsia|slate|zinc|stone/.test(n)) {
    return 'color';
  }
  if (/space|spacing|gap|size|inset|margin|padding|radius/.test(n)) return 'spacing';
  return 'unknown';
}

export function parseCssVars(input: string): ParseResult {
  const tokens: TokenSet = emptyTokenSet();
  const warnings: string[] = [];

  const typoMap = new Map<string, TypographyToken>();

  const matches = [...input.matchAll(VAR_RE)];
  if (matches.length === 0) {
    warnings.push('No CSS custom properties (--var: value;) found.');
    return { tokens, warnings };
  }

  for (const m of matches) {
    const name = m[1];
    const rawValue = m[2].trim();
    const cat = categorize(name);

    if (cat === 'color') {
      const hex = normalizeColor(rawValue);
      if (hex) {
        tokens.colors.push({ type: 'color', name, value: hex });
      } else {
        warnings.push(`Could not parse color value for --${name}: "${rawValue}"`);
      }
      continue;
    }

    if (cat === 'font-size' || cat === 'font-weight' || cat === 'line-height' || cat === 'font-family') {
      let baseName = name;
      const prefixes = ['font-family', 'font-size', 'font-weight', 'line-height', 'fontfamily', 'fontsize', 'fontweight', 'lineheight'];
      for (const p of prefixes) {
        if (baseName.toLowerCase().startsWith(p + '-')) {
          baseName = baseName.slice(p.length + 1);
          break;
        }
      }
      const suffixes = [...prefixes, 'size', 'weight', 'leading', 'font'];
      for (const p of suffixes) {
        if (baseName.toLowerCase().endsWith('-' + p)) {
          baseName = baseName.slice(0, -(p.length + 1));
          break;
        }
      }
      if (!baseName) baseName = name;
      const existing = typoMap.get(baseName) ?? { type: 'typography', name: baseName };

      if (cat === 'font-size') {
        const px = pxFromCss(rawValue);
        if (px != null) existing.fontSize = px;
      } else if (cat === 'font-weight') {
        const w = Number(rawValue);
        if (!Number.isNaN(w)) existing.fontWeight = w;
      } else if (cat === 'line-height') {
        const lh = Number(rawValue);
        if (!Number.isNaN(lh)) existing.lineHeight = lh;
      } else if (cat === 'font-family') {
        existing.fontFamily = rawValue.replace(/["']/g, '').trim();
      }

      typoMap.set(baseName, existing);
      continue;
    }

    if (cat === 'spacing') {
      const px = pxFromCss(rawValue);
      if (px != null) {
        tokens.spacing.push({ type: 'spacing', name, value: px });
      }
      continue;
    }

    const hex = normalizeColor(rawValue);
    if (hex) {
      tokens.colors.push({ type: 'color', name, value: hex });
      continue;
    }
    const px = pxFromCss(rawValue);
    if (px != null) {
      tokens.spacing.push({ type: 'spacing', name, value: px });
      continue;
    }
  }

  tokens.typography = [...typoMap.values()].filter(
    (t) => t.fontSize != null || t.fontWeight != null || t.lineHeight != null || t.fontFamily != null
  ) as TypographyToken[];

  return { tokens, warnings };
}
