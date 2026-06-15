import type { NamingConvention, TokenSet } from '../types';
import { expandHex8, toKebab } from '../util';

function xmlName(name: string): string {
  return toKebab(name).replace(/-/g, '_');
}

function androidHex(hex: string): string {
  const rgb = expandHex8(hex);
  if (!rgb) return '#FF000000';
  const a = Math.round(rgb.a * 255).toString(16).padStart(2, '0');
  const r = rgb.r.toString(16).padStart(2, '0');
  const g = rgb.g.toString(16).padStart(2, '0');
  const b = rgb.b.toString(16).padStart(2, '0');
  return `#${a}${r}${g}${b}`.toUpperCase();
}

export function serializeAndroidXml(tokens: TokenSet, _naming: NamingConvention = 'kebab-case'): string {
  const lines: string[] = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];

  if (tokens.colors.length) {
    lines.push('  <!-- Colors -->');
    for (const c of tokens.colors) {
      lines.push(`  <color name="${xmlName(c.name)}">${androidHex(c.value)}</color>`);
    }
    lines.push('');
  }

  if (tokens.spacing.length) {
    lines.push('  <!-- Spacing -->');
    for (const s of tokens.spacing) {
      lines.push(`  <dimen name="space_${xmlName(s.name)}">${s.value}dp</dimen>`);
    }
    lines.push('');
  }

  if (tokens.typography.length) {
    lines.push('  <!-- Typography -->');
    for (const t of tokens.typography) {
      if (t.fontSize != null) {
        lines.push(`  <dimen name="text_size_${xmlName(t.name)}">${t.fontSize}sp</dimen>`);
      }
    }
  }

  lines.push('</resources>');
  return lines.join('\n');
}
