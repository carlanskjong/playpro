// Helpers about Norwegian streaming, shared by several features.
import config from "../../config.js";
import { state } from "../../lib/state.js";
import { providers } from "../../lib/tmdb.js";

export const COUNTRY = config.COUNTRY || "NO";
export const myServices = () => state.profile?.services || [];

// Streaming services TMDB lists for Norway, most popular first.
let providerList = null;
export function norwegianProviders() {
  providerList ??= providers(COUNTRY);
  return providerList;
}

// Where a title can be watched in Norway, from TMDB's watch/providers data.
export function availability(results) {
  const r = results?.[COUNTRY];
  if (!r) return null;
  return {
    link: r.link,
    stream: [...(r.flatrate || []), ...(r.free || []), ...(r.ads || [])],
    rent: r.rent || [],
    buy: r.buy || [],
  };
}

// The first of your services that streams it, if any.
export function onMyService(results) {
  const a = availability(results);
  return a?.stream.find((p) => myServices().includes(p.provider_id)) || null;
}
