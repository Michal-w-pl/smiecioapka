import { GeocodeResult, ProviderResponse } from '@/lib/types';
import { WasteProvider } from './base';
import { comdProvider } from './comd';
import { kobylkaProvider } from './kobylka';
import { kiedysmieciProvider } from './kiedysmieci';
import { warsaw19115Provider } from './warsaw19115';

export const PROVIDERS: WasteProvider[] = [warsaw19115Provider, comdProvider, kobylkaProvider, kiedysmieciProvider];

export function getMatchingProviders(location: GeocodeResult) {
  return PROVIDERS.filter((provider) => provider.matches(location));
}

export async function resolveSchedule(location: GeocodeResult): Promise<ProviderResponse[]> {
  const providers = getMatchingProviders(location);
  const responses = await Promise.all(providers.map((provider) => provider.fetchSchedule(location)));
  return responses;
}

import { Provider, NormalizedLocation } from "../types";
import { comdProvider } from "./comd";
import { warsawProvider } from "./warsaw";
import { fallbackProvider } from "./fallback";

const providers: Provider[] = [warsawProvider, comdProvider, fallbackProvider];

export function resolveProvider(location: NormalizedLocation): Provider {
  return providers.find((provider) => provider.match(location)) || fallbackProvider;
}
