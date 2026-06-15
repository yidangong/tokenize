import type { NamingConvention, TokenSet } from '../types';
import { applyNaming } from '../util';

function key(prefix: string, name: string, naming: NamingConvention): string {
  return applyNaming(`${prefix}-${name}`, naming);
}

export function serializeCssVars(tokens: TokenSet, naming: NamingConvention = 'kebab-case'): string {
  const lines: string[] = [':root {'];

  if (tokens.colors.length) {
    lines.push('  /* Colors */');
    for (const c of tokens.colors) {
      lines.push(`  --${key('color', c.name, naming)}: ${c.value};`);
    }
    lines.push('');
  }

  if (tokens.spacing.length) {
    lines.push('  /* Spacing */');
    for (const s of tokens.spacing) {
      lines.push(`  --${key('space', s.name, naming)}: ${s.value}px;`);
    }
    lines.push('');
  }

  if (tokens.typography.length) {
    lines.push('  /* Typography */');
    for (const t of tokens.typography) {
      if (t.fontFamily) lines.push(`  --${key('font-family', t.name, naming)}: ${t.fontFamily};`);
      if (t.fontSize != null) lines.push(`  --${key('font-size', t.name, naming)}: ${t.fontSize}px;`);
      if (t.fontWeight != null) lines.push(`  --${key('font-weight', t.name, naming)}: ${t.fontWeight};`);
      if (t.lineHeight != null) lines.push(`  --${key('line-height', t.name, naming)}: ${t.lineHeight};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}
