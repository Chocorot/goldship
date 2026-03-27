import { Platform } from "react-native";

export type GoldPricePoint = {
  timestamp: number;
  price: number;
};

export type GoldHistorySeries = {
  points: GoldPricePoint[];
  tradingDay?: string;
  previousClose?: number;
};

const webCorsProxy = process.env.EXPO_PUBLIC_WEB_CORS_PROXY ?? "";

function resolveRequestUrls(url: string): string[] {
  if (Platform.OS !== "web" || !webCorsProxy) {
    return [url];
  }

  const encodedUrl = encodeURIComponent(url);
  if (webCorsProxy.includes("{url}")) {
    return [webCorsProxy.replace("{url}", encodedUrl)];
  }

  const candidates: string[] = [];

  // Supports prefix-style proxies such as https://proxy/? or https://proxy?url=
  if (/[?&=]$/.test(webCorsProxy)) {
    candidates.push(`${webCorsProxy}${encodedUrl}`);
  } else {
    // Some proxies accept path append; keep as fallback.
    candidates.push(`${webCorsProxy}${encodedUrl}`);
    // corsproxy.io and many generic proxies expect query style.
    candidates.push(`${webCorsProxy}?${encodedUrl}`);
    candidates.push(`${webCorsProxy}?url=${encodedUrl}`);
  }

  return [...new Set(candidates)];
}

function buildHistoryUrl(endpoint: string, range: string): string {
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}range=${encodeURIComponent(range)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const requestUrls = resolveRequestUrls(url);

  try {
    let latestError: Error | null = null;

    for (const requestUrl of requestUrls) {
      const response = await fetch(requestUrl);

      if (response.ok) {
        return response.json();
      }

      latestError = new Error(
        `${label} request failed with status ${response.status}`,
      );
    }

    if (latestError) {
      throw latestError;
    }
  } catch (error) {
    if (Platform.OS === "web" && error instanceof TypeError) {
      throw new Error(
        `${label} request was blocked by CORS. Enable CORS on the API or set EXPO_PUBLIC_WEB_CORS_PROXY in .env for web development.`,
      );
    }

    throw error;
  }
}

export async function fetchLatestGoldPrice(endpoint: string): Promise<number> {
  const data = (await fetchJson(endpoint, "Latest")) as Record<string, unknown>;
  const value =
    typeof data?.price === "number"
      ? data.price
      : typeof data?.value === "number"
        ? data.value
        : typeof data?.number === "number"
          ? data.number
          : null;

  if (value === null) {
    throw new Error("API response did not contain a numeric value");
  }

  return value;
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function toPoint(entry: unknown): GoldPricePoint | null {
  if (!isRecord(entry)) {
    return null;
  }

  const rawPrice =
    typeof entry.price === "number"
      ? entry.price
      : typeof entry.close === "number"
        ? entry.close
        : null;
  const timestamp = toTimestamp(entry.timestamp ?? entry.date);

  if (rawPrice === null || timestamp === null) {
    return null;
  }

  return {
    price: rawPrice,
    timestamp,
  };
}

function sortPointsByTimestamp(points: GoldPricePoint[]): GoldPricePoint[] {
  return [...points].sort((a, b) => a.timestamp - b.timestamp);
}

export async function fetchGoldTradingDay(
  endpoint: string,
): Promise<GoldHistorySeries> {
  const data = await fetchJson(endpoint, "Trading day");

  if (!isRecord(data) || !Array.isArray(data.points)) {
    throw new Error("Trading-day response did not contain points array");
  }

  const points = data.points
    .map((entry): GoldPricePoint | null => toPoint(entry))
    .filter((entry): entry is GoldPricePoint => entry !== null);

  return {
    points: sortPointsByTimestamp(points),
    tradingDay:
      typeof data.tradingDay === "string" ? data.tradingDay : undefined,
    previousClose:
      typeof data.previousClose === "number" ? data.previousClose : undefined,
  };
}

export async function fetchGoldHistory(
  endpoint: string,
  range = "1d",
): Promise<GoldHistorySeries> {
  const data = await fetchJson(buildHistoryUrl(endpoint, range), "History");

  if (!Array.isArray(data)) {
    throw new Error("History response did not contain an array");
  }

  const points = data
    .map((entry): GoldPricePoint | null => toPoint(entry))
    .filter((entry): entry is GoldPricePoint => entry !== null);

  return { points: sortPointsByTimestamp(points) };
}
