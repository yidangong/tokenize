import type { ColorToken } from './types';
import type { PreviewConfig, PreviewRole } from '../store/tokens';

function findColor(colors: ColorToken[], patterns: RegExp[]): ColorToken | null {
  for (const p of patterns) {
    const m = colors.find((c) => p.test(c.name));
    if (m) return m;
  }
  return null;
}

export function resolveRole(
  role: PreviewRole,
  colors: ColorToken[],
  override: string | undefined
): ColorToken | null {
  if (override) {
    const found = colors.find((c) => c.name === override);
    if (found) return found;
  }
  switch (role) {
    case 'primary':
      return (
        findColor(colors, [/^primary$|primary-?500|brand-?500|^brand$|accent-?500|indigo-?(500|600)|iris-?9|violet-?(500|600)|purple-?(500|600)/i]) ??
        findColor(colors, [/primary|brand|accent|indigo|iris|crimson|violet|purple/i]) ??
        colors[Math.min(5, colors.length - 1)] ??
        null
      );
    case 'surface':
      return (
        findColor(colors, [/surface-?(50|100|2|3)|^surface$|neutral-?(50|100)|slate-?(50|100)|stone-?(50|100)|gray-?(50|100)|^bg$/i]) ??
        findColor(colors, [/surface|slate|stone|gray|grey|neutral|background|bg/i]) ??
        colors[0] ??
        null
      );
    case 'success':
      return findColor(colors, [/success|emerald|green|teal/i]);
    case 'warning':
      return findColor(colors, [/warning|amber|yellow|orange/i]);
    case 'danger':
      return findColor(colors, [/danger|error|red|rose|crimson/i]);
    case 'info':
      return findColor(colors, [/^info$|sky|blue|cyan/i]);
  }
}

export function resolveAllRoles(colors: ColorToken[], config: PreviewConfig) {
  return {
    primary: resolveRole('primary', colors, config.primary),
    surface: resolveRole('surface', colors, config.surface),
    success: resolveRole('success', colors, config.success),
    warning: resolveRole('warning', colors, config.warning),
    danger: resolveRole('danger', colors, config.danger),
    info: resolveRole('info', colors, config.info),
  };
}

export interface ComponentImpact {
  blocks: string[];
  components: string[];
}

export function computeImpact(tokenName: string, colors: ColorToken[], config: PreviewConfig): ComponentImpact {
  const resolved = resolveAllRoles(colors, config);
  const blocks = new Set<string>();
  const components: string[] = [];

  if (resolved.primary?.name === tokenName) {
    blocks.add('buttons');
    blocks.add('badges');
    blocks.add('card');
    components.push('Primary button', 'ghost link', '"Beta" pill', 'card accent');
  }
  if (resolved.surface?.name === tokenName) {
    blocks.add('buttons');
    blocks.add('input');
    blocks.add('alert');
    blocks.add('card');
    components.push('Secondary button', 'card background', 'alert background', 'search input');
  }
  if (resolved.success?.name === tokenName) {
    blocks.add('badges');
    components.push('"Active" badge');
  }
  if (resolved.warning?.name === tokenName) {
    blocks.add('badges');
    blocks.add('alert');
    components.push('"Pending" badge', 'alert');
  }
  if (resolved.danger?.name === tokenName) {
    blocks.add('badges');
    components.push('"Failed" badge');
  }
  if (resolved.info?.name === tokenName) {
    blocks.add('badges');
    components.push('"New" badge');
  }

  return { blocks: [...blocks], components };
}
