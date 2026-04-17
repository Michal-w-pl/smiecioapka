import { Provider, NormalizedLocation } from "../types";
import { comdProvider } from "./comd";
import { warsawProvider } from "./warsaw";
import { fallbackProvider } from "./fallback";

const providers: Provider[] = [warsawProvider, comdProvider, fallbackProvider];

export function resolveProvider(location: NormalizedLocation): Provider {
  return providers.find((provider) => provider.match(location)) || fallbackProvider;
}
