import type { NamingConvention, TokenFormat, TokenSet } from '../types';
import { serializeAndroidXml } from './android-xml';
import { serializeCssVars } from './css-vars';
import { serializeStyleDict } from './style-dict';
import { serializeSwift } from './swift';
import { serializeTailwind } from './tailwind';

export function serialize(
  tokens: TokenSet,
  format: TokenFormat,
  naming: NamingConvention = 'kebab-case'
): string {
  switch (format) {
    case 'css-vars':
      return serializeCssVars(tokens, naming);
    case 'tailwind':
      return serializeTailwind(tokens, naming);
    case 'style-dict':
      return serializeStyleDict(tokens, naming);
    case 'swift':
      return serializeSwift(tokens, naming);
    case 'android-xml':
      return serializeAndroidXml(tokens, naming);
    case 'figma-vars':
      return '// Figma Variables is input-only — paste a Figma REST API variable export to ingest.';
  }
}
