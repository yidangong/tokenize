import type { TypographyToken } from './types';

const FALLBACK_LINES = [
  'The fastest way to ship a design system',
  'Typography is interface',
  'Designed with intent, built with care',
  'A canvas for ideas in motion',
  'Notes from the field',
];

function detectRole(name: string): string {
  const n = name.toLowerCase();
  if (/display|hero|jumbo|mega/.test(n)) return 'display';
  if (/^h1|headline-?(xl|large|lg|1)|page-?title/.test(n)) return 'headline-xl';
  if (/^h2|headline-?(md|medium|2)|title-?(lg|large)/.test(n)) return 'headline';
  if (/^h3|^h4|subhead|subtitle|title/.test(n)) return 'subheading';
  if (/lead|intro|deck/.test(n)) return 'lead';
  if (/body|paragraph|text-?(default|base|md)|^base$|^body$|^p$/.test(n)) return 'body';
  if (/small|tiny|footnote|legal|caption|micro|meta/.test(n)) return 'caption';
  if (/overline|eyebrow|kicker/.test(n)) return 'overline';
  if (/label|button|cta|action/.test(n)) return 'label';
  if (/code|mono|snippet/.test(n)) return 'code';
  if (/quote|blockquote|pull/.test(n)) return 'quote';
  return 'default';
}

const SAMPLES_BY_ROLE: Record<string, string> = {
  display: 'Ideas worth shipping.',
  'headline-xl': 'Design Systems at Scale',
  headline: 'A canvas for product teams',
  subheading: 'Building blocks for designers and engineers',
  lead: 'Tokenize translates your design system into every language — so the same value lives everywhere it should.',
  body: 'A design token is a named variable that stores a single design decision so it can be referenced consistently across designs and code. This sentence shows how your body type holds up at reading length.',
  caption: 'Updated 2 hours ago · 4 min read',
  overline: 'FEATURED',
  label: 'Get started',
  code: "{ color: 'brand.500' }",
  quote: '"Tokens are how designers encode meaning, not just values."',
  default: 'The quick brown fox jumps over the lazy dog',
};

let fallbackIndex = 0;

export function sampleTextFor(token: TypographyToken): string {
  const role = detectRole(token.name);
  if (role !== 'default') return SAMPLES_BY_ROLE[role];
  const line = FALLBACK_LINES[fallbackIndex % FALLBACK_LINES.length];
  fallbackIndex += 1;
  return line;
}

export function resetSampleSequence() {
  fallbackIndex = 0;
}
