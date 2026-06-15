import { formatHex } from 'culori';
import type { ParseResult, TokenSet } from '../types';
import { emptyTokenSet } from '../types';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function rgbFloatToHex(rgb: { r: number; g: number; b: number; a?: number }): string {
  const hex = formatHex({
    mode: 'rgb',
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    alpha: rgb.a ?? 1,
  });
  return hex ?? '#000000';
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[/\\.]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FigmaVariable {
  name?: string;
  resolvedType?: string;
  valuesByMode?: Record<string, Json>;
}

function isFigmaRgb(value: Json): value is { r: number; g: number; b: number; a?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, Json>).r === 'number' &&
    typeof (value as Record<string, Json>).g === 'number' &&
    typeof (value as Record<string, Json>).b === 'number'
  );
}

function firstModeValue(variable: FigmaVariable): Json | null {
  const modes = variable.valuesByMode;
  if (!modes || typeof modes !== 'object') return null;
  const values = Object.values(modes);
  return values.length > 0 ? values[0] : null;
}

export function parseFigmaVariables(input: string): ParseResult {
  const tokens: TokenSet = emptyTokenSet();
  const warnings: string[] = [];

  let json: Json;
  try {
    json = JSON.parse(input);
  } catch (e) {
    warnings.push(`Invalid JSON: ${(e as Error).message}`);
    return { tokens, warnings };
  }

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    warnings.push('Expected a JSON object at the root.');
    return { tokens, warnings };
  }

  const root = json as Record<string, Json>;
  let variablesObj: Record<string, FigmaVariable> | null = null;

  if (root.meta && typeof root.meta === 'object' && !Array.isArray(root.meta)) {
    const meta = root.meta as Record<string, Json>;
    if (meta.variables && typeof meta.variables === 'object' && !Array.isArray(meta.variables)) {
      variablesObj = meta.variables as Record<string, FigmaVariable>;
    }
  }
  if (!variablesObj && root.variables && typeof root.variables === 'object' && !Array.isArray(root.variables)) {
    variablesObj = root.variables as Record<string, FigmaVariable>;
  }

  if (!variablesObj) {
    warnings.push('No `variables` or `meta.variables` object found. Expected Figma REST API variable export shape.');
    return { tokens, warnings };
  }

  for (const [_id, variable] of Object.entries(variablesObj)) {
    if (!variable || typeof variable !== 'object') continue;
    const rawName = typeof variable.name === 'string' ? variable.name : '';
    if (!rawName) continue;
    const name = slug(rawName);
    const resolvedType = variable.resolvedType;
    const value = firstModeValue(variable);

    if (resolvedType === 'COLOR') {
      if (isFigmaRgb(value)) {
        tokens.colors.push({ type: 'color', name, value: rgbFloatToHex(value) });
      } else {
        warnings.push(`Color "${rawName}" doesn't look like an RGB-float value.`);
      }
      continue;
    }

    if (resolvedType === 'FLOAT') {
      if (typeof value === 'number') {
        tokens.spacing.push({ type: 'spacing', name, value });
      }
      continue;
    }
  }

  if (
    tokens.colors.length === 0 &&
    tokens.spacing.length === 0 &&
    tokens.typography.length === 0
  ) {
    warnings.push('No COLOR or FLOAT variables resolved from this Figma export.');
  }

  return { tokens, warnings };
}
