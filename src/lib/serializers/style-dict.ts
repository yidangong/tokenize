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

export function serializeStyleDict(tokens: TokenSet, naming: NamingConvention = 'kebab-case'): string {
  const out: Record<string, unknown> = {};

  if (tokens.colors.length) {
    const color: Record<string, unknown> = {};
    for (const c of tokens.colors) {
      place(c.name, { value: c.value, type: 'color' }, color, naming);
    }
    out.color = color;
  }

  if (tokens.spacing.length) {
    const spacing: Record<string, unknown> = {};
    for (const s of tokens.spacing) {
      place(s.name, { value: `${s.value}px`, type: 'dimension' }, spacing, naming);
    }
    out.spacing = spacing;
  }

  if (tokens.typography.length) {
    const typography: Record<string, unknown> = {};
    for (const t of tokens.typography) {
      const value: Record<string, unknown> = {};
      if (t.fontFamily) value.fontFamily = t.fontFamily;
      if (t.fontSize != null) value.fontSize = `${t.fontSize}px`;
      if (t.fontWeight != null) value.fontWeight = t.fontWeight;
      if (t.lineHeight != null) value.lineHeight = t.lineHeight;
      place(t.name, { value, type: 'typography' }, typography, naming);
    }
    out.typography = typography;
  }

  return JSON.stringify(out, null, 2);
}
