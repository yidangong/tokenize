import type { TokenFormat } from './types';

export function detectFormat(input: string): TokenFormat | null {
  const text = input.trim();
  if (!text) return null;

  if (text.startsWith('<?xml') || /<resources[\s>]/.test(text)) {
    return 'android-xml';
  }

  if (/UIColor\s*\(/.test(text) || /import\s+UIKit|import\s+SwiftUI/.test(text)) {
    return 'swift';
  }

  if (text.startsWith('{') || text.startsWith('[')) {
    if (/"resolvedType"|"valuesByMode"|"VariableID:|"variableCollectionId"/.test(text)) {
      return 'figma-vars';
    }
    return 'style-dict';
  }

  if (/^\s*(module\.exports|export\s+default|const\s+\w+\s*=\s*\{|theme\s*:)/m.test(text)) {
    return 'tailwind';
  }

  if (/:root\s*\{/.test(text) || /^\s*--[a-zA-Z]/m.test(text)) {
    return 'css-vars';
  }

  if (/^\s*colors\s*:\s*\{/m.test(text) || /^\s*spacing\s*:\s*\{/m.test(text)) {
    return 'tailwind';
  }

  return null;
}
