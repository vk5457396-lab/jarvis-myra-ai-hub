import type { ProviderAdapter } from './types';
import { googleAdapter } from './googleOAuth';
import { githubAdapter } from './githubOAuth';
import { canvaAdapter } from './canvaOAuth';

/** One adapter per underlying OAuth `provider` (registry.ts's OAUTH_PROVIDERS keys) - add a
 *  new provider by writing its own {name}OAuth.ts exporting a ProviderAdapter, then adding
 *  one entry here. connectorService.ts never branches on provider name itself. */
export const PROVIDER_ADAPTERS: Record<string, ProviderAdapter> = {
  google: googleAdapter,
  github: githubAdapter,
  canva: canvaAdapter,
};

export function getProviderAdapter(provider: string): ProviderAdapter | null {
  return PROVIDER_ADAPTERS[provider] ?? null;
}
