import { converter, formatHex } from 'culori';
import { contrastRatio } from './util';

const toOklch = converter('oklch');

interface RampStep {
  step: string;
  l: number;
  cMult: number;
}

const RAMP: RampStep[] = [
  { step: '50', l: 0.97, cMult: 0.05 },
  { step: '100', l: 0.94, cMult: 0.18 },
  { step: '200', l: 0.88, cMult: 0.32 },
  { step: '300', l: 0.79, cMult: 0.5 },
  { step: '400', l: 0.66, cMult: 0.78 },
  { step: '500', l: 0.55, cMult: 1.0 },
  { step: '600', l: 0.47, cMult: 1.0 },
  { step: '700', l: 0.38, cMult: 0.88 },
  { step: '800', l: 0.28, cMult: 0.68 },
  { step: '900', l: 0.21, cMult: 0.5 },
  { step: '950', l: 0.14, cMult: 0.32 },
];

export interface PaletteEntry {
  name: string;
  value: string;
  step: string;
}

export interface OklchTriplet {
  l: number;
  c: number;
  h: number;
}

export function hexToOklch(hex: string): OklchTriplet | null {
  const o = toOklch(hex);
  if (!o) return null;
  return { l: o.l ?? 0, c: o.c ?? 0, h: o.h ?? 0 };
}

export function formatOklch(hex: string): string {
  const o = hexToOklch(hex);
  if (!o) return '';
  return `oklch(${Math.round(o.l * 100)}% ${o.c.toFixed(3)} ${Math.round(o.h)})`;
}

export function formatOklchShort(hex: string): string {
  const o = hexToOklch(hex);
  if (!o) return '';
  return `L${Math.round(o.l * 100)} C${o.c.toFixed(2)} H${Math.round(o.h)}`;
}

export interface GroupOklchSummary {
  hue: number;
  lMin: number;
  lMax: number;
  cPeak: number;
  isRamp: boolean;
}

export function summarizeGroupOklch(hexes: string[]): GroupOklchSummary | null {
  const values = hexes.map(hexToOklch).filter((v): v is OklchTriplet => v !== null);
  if (values.length === 0) return null;
  const chromatic = values.filter((v) => v.c > 0.01);
  const hue = chromatic.length
    ? Math.round(chromatic.reduce((a, b) => a + b.h, 0) / chromatic.length)
    : 0;
  const lMin = Math.min(...values.map((v) => v.l));
  const lMax = Math.max(...values.map((v) => v.l));
  const cPeak = Math.max(...values.map((v) => v.c));
  return {
    hue,
    lMin: Math.round(lMin * 100),
    lMax: Math.round(lMax * 100),
    cPeak,
    isRamp: values.length >= 3 && lMax - lMin > 0.2,
  };
}

export function generatePalette(prefix: string, baseHex: string): PaletteEntry[] {
  const base = toOklch(baseHex);
  if (!base) return [];
  const baseC = base.c ?? 0.05;
  const h = base.h ?? 0;
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'palette';

  return RAMP.map(({ step, l, cMult }) => {
    const color = { mode: 'oklch' as const, l, c: Math.max(0, baseC * cMult), h };
    const hex = formatHex(color) ?? '#000000';
    return { name: `${safePrefix}-${step}`, value: hex, step };
  });
}

export function suggestContrastFix(
  hex: string,
  bgHex: string = '#ffffff',
  targetRatio: number = 4.5
): string | null {
  const oklch = toOklch(hex);
  if (!oklch) return null;
  const c = oklch.c ?? 0.05;
  const h = oklch.h ?? 0;
  const startL = oklch.l ?? 0.5;
  const bgOklch = toOklch(bgHex);
  const bgL = bgOklch?.l ?? 1;
  const goDarker = bgL > startL;

  const step = 0.02;
  let bestHex: string | null = null;
  for (let i = 1; i <= 50; i++) {
    const l = goDarker ? startL - step * i : startL + step * i;
    if (l < 0 || l > 1) break;
    const trial = { mode: 'oklch' as const, l, c, h };
    const trialHex = formatHex(trial);
    if (!trialHex) continue;
    const ratio = contrastRatio(trialHex, bgHex);
    if (ratio != null && ratio >= targetRatio) {
      bestHex = trialHex;
      break;
    }
  }
  return bestHex;
}
