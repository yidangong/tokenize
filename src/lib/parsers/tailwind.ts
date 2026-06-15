import type { ParseResult, TokenSet, TypographyToken } from '../types';
import { emptyTokenSet } from '../types';
import { normalizeColor, pxFromCss } from '../util';

type Anyish = unknown;

function safeEval(code: string): Anyish {
  let src = code.trim();

  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  src = src.replace(/^\s*\/\/.*$/gm, '');
  src = src.trim();

  src = src.replace(/^module\.exports\s*=\s*/, '');
  src = src.replace(/^export\s+default\s+/, '');
  src = src.replace(/^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*/, '');

  src = src.replace(/;\s*$/, '').trim();

  try {
    const fn = new Function(`"use strict"; return (${src});`);
    return fn();
  } catch {
    try {
      const fn = new Function(`"use strict"; ${src}; return (typeof module !== 'undefined' && module.exports) || null;`);
      return fn();
    } catch {
      return null;
    }
  }
}

function extractTheme(obj: Anyish): Record<string, Anyish> | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, Anyish>;
  if (o.theme && typeof o.theme === 'object') {
    const theme = o.theme as Record<string, Anyish>;
    const extend = theme.extend && typeof theme.extend === 'object' ? (theme.extend as Record<string, Anyish>) : {};
    return { ...theme, ...extend };
  }
  if (o.colors || o.spacing || o.fontFamily || o.fontSize || o.fontWeight || o.lineHeight) {
    return o;
  }
  return null;
}

function flattenColors(value: Anyish, prefix: string[] = []): Array<{ name: string; group?: string; value: string }> {
  if (typeof value === 'string') {
    return [{ name: prefix.join('-'), group: prefix.length > 1 ? prefix[0] : undefined, value }];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out: Array<{ name: string; group?: string; value: string }> = [];
    for (const [k, v] of Object.entries(value as Record<string, Anyish>)) {
      out.push(...flattenColors(v, [...prefix, k === 'DEFAULT' ? '' : k].filter(Boolean)));
    }
    return out;
  }
  return [];
}

export function parseTailwind(input: string): ParseResult {
  const tokens: TokenSet = emptyTokenSet();
  const warnings: string[] = [];

  const obj = safeEval(input);
  const theme = extractTheme(obj);
  if (!theme) {
    warnings.push('Could not find a Tailwind theme object. Paste either a full tailwind.config.js, a `{ theme: {...} }`, or an object with `colors`, `spacing`, etc.');
    return { tokens, warnings };
  }

  if (theme.colors) {
    for (const c of flattenColors(theme.colors)) {
      const hex = normalizeColor(c.value);
      if (hex) {
        tokens.colors.push({ type: 'color', name: c.name, group: c.group, value: hex });
      } else {
        warnings.push(`Could not parse color "${c.name}": ${c.value}`);
      }
    }
  }

  if (theme.spacing && typeof theme.spacing === 'object') {
    for (const [k, v] of Object.entries(theme.spacing as Record<string, Anyish>)) {
      if (typeof v !== 'string' && typeof v !== 'number') continue;
      const px = typeof v === 'number' ? v : pxFromCss(v);
      if (px != null) tokens.spacing.push({ type: 'spacing', name: k, value: px });
    }
  }

  const typoMap = new Map<string, TypographyToken>();
  const ensure = (name: string): TypographyToken => {
    let t = typoMap.get(name);
    if (!t) { t = { type: 'typography', name }; typoMap.set(name, t); }
    return t;
  };

  if (theme.fontFamily && typeof theme.fontFamily === 'object') {
    for (const [k, v] of Object.entries(theme.fontFamily as Record<string, Anyish>)) {
      const family = Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '';
      if (family) ensure(k).fontFamily = family;
    }
  }

  if (theme.fontSize && typeof theme.fontSize === 'object') {
    for (const [k, v] of Object.entries(theme.fontSize as Record<string, Anyish>)) {
      let raw: Anyish = v;
      if (Array.isArray(v)) raw = v[0];
      if (typeof raw !== 'string' && typeof raw !== 'number') continue;
      const px = typeof raw === 'number' ? raw : pxFromCss(raw);
      if (px != null) ensure(k).fontSize = px;
    }
  }

  if (theme.fontWeight && typeof theme.fontWeight === 'object') {
    for (const [k, v] of Object.entries(theme.fontWeight as Record<string, Anyish>)) {
      const w = typeof v === 'number' ? v : Number(v);
      if (!Number.isNaN(w)) ensure(k).fontWeight = w;
    }
  }

  if (theme.lineHeight && typeof theme.lineHeight === 'object') {
    for (const [k, v] of Object.entries(theme.lineHeight as Record<string, Anyish>)) {
      const lh = typeof v === 'number' ? v : Number(v);
      if (!Number.isNaN(lh)) ensure(k).lineHeight = lh;
    }
  }

  tokens.typography = [...typoMap.values()];

  if (tokens.colors.length === 0 && tokens.spacing.length === 0 && tokens.typography.length === 0) {
    warnings.push('No recognized tokens found in this Tailwind config.');
  }

  return { tokens, warnings };
}
