import type { NamingConvention, TokenSet } from '../types';
import { applyNaming } from '../util';

function nestDeep(name: string, value: unknown, root: Record<string, unknown>): void {
  const parts = name.split('-').filter(Boolean);
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (!node[seg] || typeof node[seg] !== 'object') {
      node[seg] = {};
    }
    node = node[seg] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

function place(name: string, value: unknown, root: Record<string, unknown>, naming: NamingConvention): void {
  const renamed = applyNaming(name, naming);
  if (naming === 'kebab-case') {
    nestDeep(renamed, value, root);
  } else {
    root[renamed] = value;
  }
}

function indent(obj: unknown, depth = 1): string {
  const pad = '  '.repeat(depth);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number') return String(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map((v) => indent(v, depth + 1)).join(', ')}]`;
  }
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(([k, v]) => `${pad}${JSON.stringify(k)}: ${indent(v, depth + 1)}`)
      .join(',\n')}\n${'  '.repeat(depth - 1)}}`;
  }
  return JSON.stringify(obj);
}

export function serializeTailwind(tokens: TokenSet, naming: NamingConvention = 'kebab-case'): string {
  const theme: Record<string, unknown> = {};

  if (tokens.colors.length) {
    const colors: Record<string, unknown> = {};
    for (const c of tokens.colors) place(c.name, c.value, colors, naming);
    theme.colors = colors;
  }

  if (tokens.spacing.length) {
    const spacing: Record<string, unknown> = {};
    for (const s of tokens.spacing) {
      place(s.name, `${s.value / 16}rem`, spacing, naming);
    }
    theme.spacing = spacing;
  }

  if (tokens.typography.length) {
    const fontFamily: Record<string, unknown> = {};
    const fontSize: Record<string, unknown> = {};
    const fontWeight: Record<string, unknown> = {};
    const lineHeight: Record<string, unknown> = {};
    for (const t of tokens.typography) {
      if (t.fontFamily) place(t.name, t.fontFamily.split(',').map((p) => p.trim()), fontFamily, naming);
      if (t.fontSize != null) place(t.name, `${t.fontSize / 16}rem`, fontSize, naming);
      if (t.fontWeight != null) place(t.name, t.fontWeight, fontWeight, naming);
      if (t.lineHeight != null) place(t.name, t.lineHeight, lineHeight, naming);
    }
    if (Object.keys(fontFamily).length) theme.fontFamily = fontFamily;
    if (Object.keys(fontSize).length) theme.fontSize = fontSize;
    if (Object.keys(fontWeight).length) theme.fontWeight = fontWeight;
    if (Object.keys(lineHeight).length) theme.lineHeight = lineHeight;
  }

  const config = { theme: { extend: theme } };
  return `/** @type {import('tailwindcss').Config} */\nexport default ${indent(config, 1)};\n`;
}
