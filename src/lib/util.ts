import { formatHex, parse as parseColor } from 'culori';
import type { NamingConvention } from './types';

export function normalizeColor(input: string): string | null {
  const trimmed = input.trim();
  try {
    const parsed = parseColor(trimmed);
    if (!parsed) return null;
    const hex = formatHex(parsed);
    return hex ?? null;
  } catch {
    return null;
  }
}

export function pxFromCss(value: string, base = 16): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const px = trimmed.match(/^(-?\d*\.?\d+)px$/i);
  if (px) return Number(px[1]);

  const rem = trimmed.match(/^(-?\d*\.?\d+)rem$/i);
  if (rem) return Number(rem[1]) * base;

  const em = trimmed.match(/^(-?\d*\.?\d+)em$/i);
  if (em) return Number(em[1]) * base;

  const num = trimmed.match(/^(-?\d*\.?\d+)$/);
  if (num) return Number(num[1]);

  return null;
}

export function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_.]+/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

export function toCamel(name: string): string {
  const kebab = toKebab(name);
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toPascal(name: string): string {
  const camel = toCamel(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function applyNaming(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'kebab-case':
      return toKebab(name);
    case 'camelCase':
      return toCamel(name);
    case 'PascalCase':
      return toPascal(name);
  }
}

export function expandHex8(hex: string): { r: number; g: number; b: number; a: number } | null {
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length === 4) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b, a };
}

export function relativeLuminance(hex: string): number | null {
  const rgb = expandHex8(hex);
  if (!rgb) return null;
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

export function contrastRatio(fg: string, bg: string): number | null {
  const lf = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  if (lf == null || lb == null) return null;
  const [bright, dark] = lf > lb ? [lf, lb] : [lb, lf];
  return (bright + 0.05) / (dark + 0.05);
}
