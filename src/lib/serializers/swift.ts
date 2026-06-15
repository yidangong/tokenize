import type { NamingConvention, TokenSet } from '../types';
import { applyNaming, expandHex8, toPascal } from '../util';

function swiftName(name: string, naming: NamingConvention): string {
  const base = applyNaming(name, naming);
  if (naming === 'PascalCase') return base;
  if (naming === 'camelCase') return base;
  return toPascal(base);
}

function swiftColor(hex: string): string {
  const rgb = expandHex8(hex);
  if (!rgb) return `UIColor.black`;
  const r = (rgb.r / 255).toFixed(3);
  const g = (rgb.g / 255).toFixed(3);
  const b = (rgb.b / 255).toFixed(3);
  const a = rgb.a.toFixed(3);
  return `UIColor(red: ${r}, green: ${g}, blue: ${b}, alpha: ${a})`;
}

export function serializeSwift(tokens: TokenSet, naming: NamingConvention = 'camelCase'): string {
  const lines: string[] = ['import UIKit', '', 'enum DesignTokens {'];

  if (tokens.colors.length) {
    lines.push('  enum Colors {');
    for (const c of tokens.colors) {
      const name = swiftName(c.name, naming === 'kebab-case' ? 'camelCase' : naming);
      lines.push(`    static let ${name} = ${swiftColor(c.value)}`);
    }
    lines.push('  }');
    lines.push('');
  }

  if (tokens.spacing.length) {
    lines.push('  enum Spacing {');
    for (const s of tokens.spacing) {
      const name = swiftName(s.name, naming === 'kebab-case' ? 'camelCase' : naming);
      lines.push(`    static let ${name}: CGFloat = ${s.value}`);
    }
    lines.push('  }');
    lines.push('');
  }

  if (tokens.typography.length) {
    lines.push('  enum Typography {');
    for (const t of tokens.typography) {
      const name = swiftName(t.name, naming === 'kebab-case' ? 'camelCase' : naming);
      const family = t.fontFamily ?? 'System';
      const size = t.fontSize ?? 16;
      const weight = t.fontWeight ?? 400;
      const weightExpr = weight >= 700 ? '.bold' : weight >= 600 ? '.semibold' : weight >= 500 ? '.medium' : '.regular';
      lines.push(`    static let ${name} = UIFont.systemFont(ofSize: ${size}, weight: ${weightExpr}) // ${family}`);
    }
    lines.push('  }');
  }

  lines.push('}');
  return lines.join('\n');
}
