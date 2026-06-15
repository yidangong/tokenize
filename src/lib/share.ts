import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { NamingConvention, TokenFormat } from './types';
import type { Theme } from '../store/tokens';

export interface ShareState {
  input: string;
  inputFormat: TokenFormat;
  naming: NamingConvention;
  activeOutput: TokenFormat;
  theme?: Theme;
}

const VERSION = 1;

export function encodeShare(state: ShareState): string {
  const payload = {
    v: VERSION,
    i: state.input,
    f: state.inputFormat,
    n: state.naming,
    o: state.activeOutput,
    t: state.theme,
  };
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeShare(encoded: string): ShareState | null {
  try {
    const raw = decompressFromEncodedURIComponent(encoded);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data == null) return null;
    if (data.v !== VERSION) return null;
    return {
      input: typeof data.i === 'string' ? data.i : '',
      inputFormat: data.f,
      naming: data.n,
      activeOutput: data.o,
      theme: data.t,
    };
  } catch {
    return null;
  }
}

export function readShareFromUrl(): ShareState | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith('#s=')) return null;
  return decodeShare(hash.slice(3));
}

export function buildShareUrl(state: ShareState): string {
  const encoded = encodeShare(state);
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#s=${encoded}`;
}
