import type { ParseResult, TokenFormat } from '../types';
import { emptyTokenSet } from '../types';
import { parseCssVars } from './css-vars';
import { parseStyleDict } from './style-dict';
import { parseTailwind } from './tailwind';
import { parseFigmaVariables } from './figma-variables';

export function parse(input: string, format: TokenFormat): ParseResult {
  if (!input.trim()) {
    return { tokens: emptyTokenSet(), warnings: [] };
  }

  switch (format) {
    case 'css-vars':
      return parseCssVars(input);
    case 'style-dict':
      return parseStyleDict(input);
    case 'tailwind':
      return parseTailwind(input);
    case 'figma-vars':
      return parseFigmaVariables(input);
    case 'swift':
    case 'android-xml':
      return {
        tokens: emptyTokenSet(),
        warnings: [`Parsing ${format} as input isn't supported yet — it's output-only for now.`],
      };
  }
}
