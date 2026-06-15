export type TokenFormat =
  | 'css-vars'
  | 'tailwind'
  | 'style-dict'
  | 'figma-vars'
  | 'swift'
  | 'android-xml';

export interface ColorToken {
  type: 'color';
  name: string;
  value: string;
  group?: string;
}

export interface SpacingToken {
  type: 'spacing';
  name: string;
  value: number;
}

export interface TypographyToken {
  type: 'typography';
  name: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
}

export type Token = ColorToken | SpacingToken | TypographyToken;

export interface TokenSet {
  colors: ColorToken[];
  spacing: SpacingToken[];
  typography: TypographyToken[];
}

export interface ParseResult {
  tokens: TokenSet;
  warnings: string[];
}

export interface FormatMeta {
  id: TokenFormat;
  label: string;
  monacoLang: string;
  fileExt: string;
}

export const FORMATS: Record<TokenFormat, FormatMeta> = {
  'css-vars': {
    id: 'css-vars',
    label: 'CSS Variables',
    monacoLang: 'css',
    fileExt: 'css',
  },
  'tailwind': {
    id: 'tailwind',
    label: 'Tailwind Config',
    monacoLang: 'javascript',
    fileExt: 'js',
  },
  'style-dict': {
    id: 'style-dict',
    label: 'Style Dictionary',
    monacoLang: 'json',
    fileExt: 'json',
  },
  'figma-vars': {
    id: 'figma-vars',
    label: 'Figma Variables',
    monacoLang: 'json',
    fileExt: 'json',
  },
  'swift': {
    id: 'swift',
    label: 'iOS Swift',
    monacoLang: 'swift',
    fileExt: 'swift',
  },
  'android-xml': {
    id: 'android-xml',
    label: 'Android XML',
    monacoLang: 'xml',
    fileExt: 'xml',
  },
};

export const PARSEABLE_FORMATS: TokenFormat[] = ['css-vars', 'tailwind', 'style-dict', 'figma-vars'];
export const OUTPUT_FORMATS: TokenFormat[] = [
  'css-vars',
  'tailwind',
  'style-dict',
  'swift',
  'android-xml',
];

export type NamingConvention = 'kebab-case' | 'camelCase' | 'PascalCase';

export const emptyTokenSet = (): TokenSet => ({
  colors: [],
  spacing: [],
  typography: [],
});
