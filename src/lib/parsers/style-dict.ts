import type { ParseResult, TokenSet, TypographyToken } from '../types';
import { emptyTokenSet } from '../types';
import { normalizeColor, pxFromCss } from '../util';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix: string[] = []): Array<{ path: string[]; value: Json }> {
  const out: Array<{ path: string[]; value: Json }> = [];
  if (obj == null) return out;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    out.push({ path: prefix, value: obj });
    return out;
  }

  const dtcgValue = (obj as Record<string, Json>).$value;
  const legacyValue = (obj as Record<string, Json>).value;
  const leaf = dtcgValue !== undefined ? dtcgValue : legacyValue;

  if (leaf !== undefined && (typeof leaf === 'string' || typeof leaf === 'number')) {
    out.push({ path: prefix, value: leaf });
    return out;
  }

  for (const [k, v] of Object.entries(obj)) {
    if (k === '$type' || k === '$description' || k === '$extensions') continue;
    out.push(...flatten(v, [...prefix, k]));
  }
  return out;
}

export function parseStyleDict(input: string): ParseResult {
  const tokens: TokenSet = emptyTokenSet();
  const warnings: string[] = [];

  let json: Json;
  try {
    json = JSON.parse(input);
  } catch (e) {
    warnings.push(`Invalid JSON: ${(e as Error).message}`);
    return { tokens, warnings };
  }

  if (typeof json !== 'object' || json == null) {
    warnings.push('Expected a JSON object at the root.');
    return { tokens, warnings };
  }

  const root = json as { [k: string]: Json };
  const sections: Record<'color' | 'spacing' | 'typography', Json | undefined> = {
    color: root.color ?? root.colors,
    spacing: root.spacing ?? root.size ?? root.sizes,
    typography: root.typography ?? root.font ?? root.fonts,
  };

  if (sections.color) {
    for (const { path, value } of flatten(sections.color)) {
      if (typeof value !== 'string') continue;
      const hex = normalizeColor(value);
      if (hex) {
        const name = path.join('-');
        const group = path.length > 1 ? path[0] : undefined;
        tokens.colors.push({ type: 'color', name, value: hex, group });
      } else {
        warnings.push(`Could not parse color at color.${path.join('.')}: "${value}"`);
      }
    }
  }

  if (sections.spacing) {
    for (const { path, value } of flatten(sections.spacing)) {
      const px = typeof value === 'number' ? value : typeof value === 'string' ? pxFromCss(value) : null;
      if (px != null) {
        tokens.spacing.push({ type: 'spacing', name: path.join('-'), value: px });
      }
    }
  }

  if (sections.typography && typeof sections.typography === 'object' && !Array.isArray(sections.typography)) {
    for (const [name, value] of Object.entries(sections.typography as Record<string, Json>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const v = value as Record<string, Json>;
      const dtcgInner = (v.$value && typeof v.$value === 'object' && !Array.isArray(v.$value)
        ? (v.$value as Record<string, Json>)
        : null);
      const legacyInner = (v.value && typeof v.value === 'object' && !Array.isArray(v.value)
        ? (v.value as Record<string, Json>)
        : null);
      const inner = dtcgInner ?? legacyInner ?? v;

      const t: TypographyToken = { type: 'typography', name };
      const ff = inner.fontFamily ?? inner['font-family'];
      const fs = inner.fontSize ?? inner['font-size'];
      const fw = inner.fontWeight ?? inner['font-weight'];
      const lh = inner.lineHeight ?? inner['line-height'];

      if (typeof ff === 'string') t.fontFamily = ff;
      if (typeof fs === 'string') {
        const px = pxFromCss(fs);
        if (px != null) t.fontSize = px;
      } else if (typeof fs === 'number') t.fontSize = fs;
      if (typeof fw === 'number') t.fontWeight = fw;
      else if (typeof fw === 'string' && !Number.isNaN(Number(fw))) t.fontWeight = Number(fw);
      if (typeof lh === 'number') t.lineHeight = lh;
      else if (typeof lh === 'string' && !Number.isNaN(Number(lh))) t.lineHeight = Number(lh);

      if (t.fontFamily || t.fontSize != null || t.fontWeight != null || t.lineHeight != null) {
        tokens.typography.push(t);
      }
    }
  }

  if (tokens.colors.length === 0 && tokens.spacing.length === 0 && tokens.typography.length === 0) {
    warnings.push('No recognized tokens found. Expected top-level "color", "spacing", or "typography" keys.');
  }

  return { tokens, warnings };
}
