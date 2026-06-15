import type { TokenFormat } from './types';

export type TypographyProperty = 'fontSize' | 'fontWeight' | 'lineHeight' | 'fontFamily';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatchingBrace(source: string, openBracePos: number): number {
  let depth = 0;
  for (let i = openBracePos; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceInSection(
  source: string,
  sectionRegex: RegExp,
  replacer: (sectionBody: string) => { body: string; matched: boolean }
): string | null {
  const m = sectionRegex.exec(source);
  if (!m) return null;
  const sectionOpenIdx = m.index + m[0].length - 1;
  const sectionCloseIdx = findMatchingBrace(source, sectionOpenIdx);
  if (sectionCloseIdx === -1) return null;
  const head = source.substring(0, sectionOpenIdx + 1);
  const body = source.substring(sectionOpenIdx + 1, sectionCloseIdx);
  const tail = source.substring(sectionCloseIdx);
  const { body: newBody, matched } = replacer(body);
  if (!matched) return null;
  return head + newBody + tail;
}

function replaceTailwindLeafKey(
  source: string,
  sectionName: string,
  key: string,
  newValueExpr: string
): string | null {
  const escapedKey = escapeRegex(key);
  const sectionRe = new RegExp(`${escapeRegex(sectionName)}\\s*:\\s*\\{`);

  return replaceInSection(source, sectionRe, (body) => {
    const stringRe = new RegExp(
      `((['"]?)${escapedKey}\\2\\s*:\\s*)(['"])([^'"]+)\\3`,
      'g'
    );
    const arrayRe = new RegExp(`((['"]?)${escapedKey}\\2\\s*:\\s*)\\[[^\\]]*\\]`, 'g');
    const numberRe = new RegExp(`((['"]?)${escapedKey}\\2\\s*:\\s*)(-?\\d+\\.?\\d*)`, 'g');

    let matched = false;
    let next = body;
    if (stringRe.test(body)) {
      next = body.replace(stringRe, (_m, prefix) => {
        matched = true;
        return `${prefix}${newValueExpr}`;
      });
    } else if (arrayRe.test(body)) {
      next = body.replace(arrayRe, (_m, prefix) => {
        matched = true;
        return `${prefix}${newValueExpr}`;
      });
    } else if (numberRe.test(body)) {
      next = body.replace(numberRe, (_m, prefix) => {
        matched = true;
        return `${prefix}${newValueExpr}`;
      });
    }
    return { body: next, matched };
  });
}

export function replaceCssVar(source: string, varName: string, newValue: string): string | null {
  const re = new RegExp(`(--${escapeRegex(varName)}\\s*:\\s*)([^;\\n]+)`, 'g');
  let count = 0;
  const result = source.replace(re, (_m, prefix) => {
    count += 1;
    return `${prefix}${newValue}`;
  });
  return count > 0 ? result : null;
}

export function replaceStyleDictColorValue(source: string, tokenName: string, newValue: string): string | null {
  const lastSegment = tokenName.split('-').pop() ?? tokenName;
  const escaped = escapeRegex(lastSegment);

  const reDtcg = new RegExp(
    `("${escaped}"\\s*:\\s*\\{[^{}]*?"\\$?value"\\s*:\\s*")([^"]+)(")`,
    's'
  );
  const reFlat = new RegExp(`("${escaped}"\\s*:\\s*")([^"]+)(")`, 's');

  if (reDtcg.test(source)) {
    return source.replace(reDtcg, (_m, p, _v, s) => `${p}${newValue}${s}`);
  }
  if (reFlat.test(source)) {
    return source.replace(reFlat, (_m, p, _v, s) => `${p}${newValue}${s}`);
  }
  return null;
}

export function replaceTailwindColorValue(source: string, tokenName: string, newValue: string): string | null {
  const segments = tokenName.split('-');
  const last = segments[segments.length - 1];
  const escaped = escapeRegex(last);
  const keyPattern = `(['"]?)${escaped}\\1`;
  const re = new RegExp(`(${keyPattern}\\s*:\\s*['"])([^'"]+)(['"])`, 'g');

  let count = 0;
  const result = source.replace(re, (_m, prefix, _q, _v, suffix) => {
    count += 1;
    return `${prefix}${newValue}${suffix}`;
  });
  return count > 0 ? result : null;
}

export function replaceColorValue(
  source: string,
  format: TokenFormat,
  tokenName: string,
  newValue: string
): string | null {
  switch (format) {
    case 'css-vars':
      return replaceCssVar(source, tokenName, newValue);
    case 'style-dict':
      return replaceStyleDictColorValue(source, tokenName, newValue);
    case 'tailwind':
      return replaceTailwindColorValue(source, tokenName, newValue);
    default:
      return null;
  }
}

const CSS_TYPO_PROP: Record<TypographyProperty, string> = {
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  fontFamily: 'font-family',
};

function replaceCssVarTypography(
  source: string,
  tokenName: string,
  propType: TypographyProperty,
  newValue: string
): string | null {
  const cssProp = CSS_TYPO_PROP[propType];
  const escaped = escapeRegex(tokenName);

  const prefixRe = new RegExp(`(--${cssProp}-${escaped}\\s*:\\s*)([^;\\n]+)`, 'g');
  const suffixRe = new RegExp(`(--${escaped}-${cssProp}\\s*:\\s*)([^;\\n]+)`, 'g');

  let count = 0;
  let result = source.replace(prefixRe, (_m, prefix) => {
    count += 1;
    return `${prefix}${newValue}`;
  });
  if (count === 0) {
    result = source.replace(suffixRe, (_m, prefix) => {
      count += 1;
      return `${prefix}${newValue}`;
    });
  }
  return count > 0 ? result : null;
}

function cssValueToArrayLiteral(cssValue: string): string {
  const parts = cssValue
    .split(',')
    .map((p) => p.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  return '[' + parts.map((p) => (/^[a-z-]+$/.test(p) ? `'${p}'` : `'${p}'`)).join(', ') + ']';
}

function tailwindTypographyExpr(propType: TypographyProperty, newValue: string): string {
  switch (propType) {
    case 'fontSize':
      return `'${newValue}'`;
    case 'fontWeight':
      return String(Number(newValue));
    case 'lineHeight':
      return String(Number(newValue));
    case 'fontFamily':
      return cssValueToArrayLiteral(newValue);
  }
}

const TAILWIND_TYPO_SECTION: Record<TypographyProperty, string> = {
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  fontFamily: 'fontFamily',
};

function replaceTailwindTypography(
  source: string,
  tokenName: string,
  propType: TypographyProperty,
  newValue: string
): string | null {
  const section = TAILWIND_TYPO_SECTION[propType];
  const expr = tailwindTypographyExpr(propType, newValue);
  return replaceTailwindLeafKey(source, section, tokenName, expr);
}

function replaceStyleDictTypography(
  source: string,
  tokenName: string,
  propType: TypographyProperty,
  newValue: string
): string | null {
  const lastSegment = tokenName.split('-').pop() ?? tokenName;
  const escapedName = escapeRegex(lastSegment);
  const escapedProp = escapeRegex(propType);

  const reString = new RegExp(
    `("${escapedName}"\\s*:\\s*\\{[\\s\\S]*?"${escapedProp}"\\s*:\\s*")([^"]+)(")`
  );
  const reNumber = new RegExp(
    `("${escapedName}"\\s*:\\s*\\{[\\s\\S]*?"${escapedProp}"\\s*:\\s*)(-?\\d+\\.?\\d*)`
  );

  const numericProp = propType === 'fontWeight' || propType === 'lineHeight';
  const isNumeric = /^-?\d+\.?\d*$/.test(newValue);

  if (numericProp && isNumeric) {
    if (reNumber.test(source)) {
      return source.replace(reNumber, (_m, prefix) => `${prefix}${newValue}`);
    }
    if (reString.test(source)) {
      return source.replace(reString, (_m, p, _v, s) => `${p}${newValue}${s}`);
    }
    return null;
  }

  if (reString.test(source)) {
    return source.replace(reString, (_m, p, _v, s) => `${p}${newValue}${s}`);
  }
  return null;
}

export function replaceTypographyValue(
  source: string,
  format: TokenFormat,
  tokenName: string,
  propType: TypographyProperty,
  newValue: string
): string | null {
  switch (format) {
    case 'css-vars':
      return replaceCssVarTypography(source, tokenName, propType, newValue);
    case 'tailwind':
      return replaceTailwindTypography(source, tokenName, propType, newValue);
    case 'style-dict':
      return replaceStyleDictTypography(source, tokenName, propType, newValue);
    default:
      return null;
  }
}

function replaceCssVarSpacing(source: string, tokenName: string, newValue: string): string | null {
  const escaped = escapeRegex(tokenName);
  const re = new RegExp(`(--${escaped}\\s*:\\s*)([^;\\n]+)`, 'g');
  let count = 0;
  const result = source.replace(re, (_m, prefix) => {
    count += 1;
    return `${prefix}${newValue}`;
  });
  return count > 0 ? result : null;
}

function replaceTailwindSpacing(source: string, tokenName: string, newValueInPx: number): string | null {
  return replaceTailwindLeafKey(source, 'spacing', tokenName, `'${newValueInPx}px'`);
}

function replaceStyleDictSpacing(source: string, tokenName: string, newValue: string): string | null {
  return replaceStyleDictColorValue(source, tokenName, newValue);
}

export function replaceSpacingValue(
  source: string,
  format: TokenFormat,
  tokenName: string,
  newValueInPx: number
): string | null {
  switch (format) {
    case 'css-vars':
      return replaceCssVarSpacing(source, tokenName, `${newValueInPx}px`);
    case 'tailwind':
      return replaceTailwindSpacing(source, tokenName, newValueInPx);
    case 'style-dict':
      return replaceStyleDictSpacing(source, tokenName, `${newValueInPx}px`);
    default:
      return null;
  }
}

function findCssRootInsertionPoint(source: string): number | null {
  const match = source.match(/:root\s*\{/);
  if (!match || match.index == null) return null;
  const openIdx = match.index + match[0].length - 1;
  const closeIdx = findMatchingBrace(source, openIdx);
  if (closeIdx === -1) return null;
  return closeIdx;
}

function insertIntoCssRoot(source: string, lines: string[]): string {
  const insertion = lines.join('\n') + '\n';
  const insertPos = findCssRootInsertionPoint(source);
  if (insertPos === null) {
    return `:root {\n${insertion}}\n${source.trimStart()}`;
  }
  return source.substring(0, insertPos) + insertion + source.substring(insertPos);
}

export interface AppendableTypographyProps {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
}

export function appendColor(
  source: string,
  format: TokenFormat,
  name: string,
  value: string
): string | null {
  if (format !== 'css-vars') return null;
  const prefixed = name.startsWith('color-') ? name : `color-${name}`;
  return insertIntoCssRoot(source, [`  --${prefixed}: ${value};`]);
}

export function appendColors(
  source: string,
  format: TokenFormat,
  entries: Array<{ name: string; value: string }>
): string | null {
  if (format !== 'css-vars') return null;
  if (entries.length === 0) return null;
  const lines = entries.map(({ name, value }) => {
    const prefixed = name.startsWith('color-') ? name : `color-${name}`;
    return `  --${prefixed}: ${value};`;
  });
  return insertIntoCssRoot(source, lines);
}

export function appendSpacing(
  source: string,
  format: TokenFormat,
  name: string,
  valueInPx: number
): string | null {
  if (format !== 'css-vars') return null;
  const prefixed = name.startsWith('space-') ? name : `space-${name}`;
  return insertIntoCssRoot(source, [`  --${prefixed}: ${valueInPx}px;`]);
}

export function appendTypography(
  source: string,
  format: TokenFormat,
  name: string,
  props: AppendableTypographyProps
): string | null {
  if (format !== 'css-vars') return null;
  const lines: string[] = [];
  if (props.fontFamily) lines.push(`  --font-family-${name}: ${props.fontFamily};`);
  if (props.fontSize != null) lines.push(`  --font-size-${name}: ${props.fontSize}px;`);
  if (props.fontWeight != null) lines.push(`  --font-weight-${name}: ${props.fontWeight};`);
  if (props.lineHeight != null) lines.push(`  --line-height-${name}: ${props.lineHeight};`);
  if (lines.length === 0) return null;
  return insertIntoCssRoot(source, lines);
}
