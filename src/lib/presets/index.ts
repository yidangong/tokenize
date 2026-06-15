import type { TokenFormat } from '../types';
import { BLANK_PRESET } from './blank';
import { MATERIAL_3_PRESET } from './material3';
import { PULSE_PRESET } from './pulse';
import { RADIX_COLORS_PRESET } from './radix';
import { TAILWIND_DEFAULT_PRESET } from './tailwind-default';

export interface Preset {
  id: string;
  label: string;
  description: string;
  format: TokenFormat;
  source: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'tailwind-default',
    label: 'Tailwind essentials',
    description: 'A curated subset of the default Tailwind palette + spacing + type scale.',
    format: 'tailwind',
    source: TAILWIND_DEFAULT_PRESET,
  },
  {
    id: 'pulse',
    label: 'Pulse — opinionated SaaS',
    description: 'Linear-style system: two brand candidates, 9-step neutrals, intent-named semantics. Great for testing Preview config.',
    format: 'css-vars',
    source: PULSE_PRESET,
  },
  {
    id: 'radix-colors',
    label: 'Radix Colors',
    description: 'Radix UI colors with a spacing & type scale, expressed as CSS variables.',
    format: 'css-vars',
    source: RADIX_COLORS_PRESET,
  },
  {
    id: 'material-3',
    label: 'Material 3',
    description: 'Sample of Material You tokens in Style Dictionary JSON format.',
    format: 'style-dict',
    source: MATERIAL_3_PRESET,
  },
  {
    id: 'blank',
    label: 'Blank slate — build from scratch',
    description: 'Start empty. Add colors, spacing, and type roles directly from the Preview panel — no code required.',
    format: 'css-vars',
    source: BLANK_PRESET,
  },
];
