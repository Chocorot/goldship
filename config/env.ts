function toWsUrl(url: string): string {
  if (!url) {
    return "";
  }

  if (url.startsWith("wss://") || url.startsWith("ws://")) {
    return url;
  }

  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`;
  }

  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`;
  }

  return url;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function deriveTradingDayUrl(historyUrl: string, latestUrl: string): string {
  if (historyUrl.includes("/api/gold/history")) {
    return historyUrl.replace(
      /\/api\/gold\/history(?:\?.*)?$/,
      "/api/gold/trading-day",
    );
  }

  if (latestUrl.includes("/api/gold")) {
    return latestUrl.replace(
      /\/api\/gold\/?(?:\?.*)?$/,
      "/api/gold/trading-day",
    );
  }

  return "";
}

const fromBase = process.env.EXPO_PUBLIC_GOLD_API_BASE ?? "";
const legacyEndpoint = process.env.EXPO_PUBLIC_GOLD_API ?? "";

// Backward compatibility: allow old EXPO_PUBLIC_GOLD_API values like
// https://your-host/api/gold and derive the shared host from it.
const inferredBase = legacyEndpoint
  ? legacyEndpoint.replace(/\/api\/gold\/?$/, "")
  : "";

const baseUrl = stripTrailingSlash(fromBase || inferredBase);

export const GOLD_LATEST_API =
  process.env.EXPO_PUBLIC_GOLD_API_LATEST ??
  (baseUrl ? `${baseUrl}/api/gold` : legacyEndpoint);

export const GOLD_HISTORY_API =
  process.env.EXPO_PUBLIC_GOLD_API_HISTORY ??
  (baseUrl ? `${baseUrl}/api/gold/history` : "");

export const GOLD_TRADING_DAY_API =
  process.env.EXPO_PUBLIC_GOLD_API_TRADING_DAY ??
  (baseUrl
    ? `${baseUrl}/api/gold/trading-day`
    : deriveTradingDayUrl(GOLD_HISTORY_API, GOLD_LATEST_API));

export const GOLD_WS_API =
  process.env.EXPO_PUBLIC_GOLD_API_WS ??
  (baseUrl ? `${toWsUrl(baseUrl)}/ws/realtime` : "");
