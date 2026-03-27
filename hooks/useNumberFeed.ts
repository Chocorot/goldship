import { useCallback, useEffect, useRef, useState } from "react";

import {
    fetchGoldHistory,
    fetchGoldTradingDay,
    GoldHistorySeries,
} from "@/services/numberApi";

type UseNumberFeedOptions = {
  historyEndpoint: string;
  tradingDayEndpoint?: string;
  wsEndpoint: string;
  historyRange?: string;
  refreshIntervalMs?: number;
};

export function useNumberFeed({
  historyEndpoint,
  tradingDayEndpoint,
  wsEndpoint,
  historyRange = "1d",
  refreshIntervalMs = 30000,
}: UseNumberFeedOptions) {
  const [value, setValue] = useState<number | null>(null);
  const [history, setHistory] = useState<GoldHistorySeries>({ points: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef(0);
  const prevRangeRef = useRef(historyRange);
  const wsRef = useRef<WebSocket | null>(null);
  const isTradingDayRange = historyRange.toLowerCase() === "1d";

  const load = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    const rangeChanged = prevRangeRef.current !== historyRange;
    if (rangeChanged) {
      prevRangeRef.current = historyRange;
      setHistory({ points: [] });
      setIsLoading(true);
    }

    try {
      if (isTradingDayRange && !tradingDayEndpoint) {
        throw new Error("Missing EXPO_PUBLIC_GOLD_API_TRADING_DAY in .env");
      }
      if (!isTradingDayRange && !historyEndpoint) {
        throw new Error("Missing EXPO_PUBLIC_GOLD_API_HISTORY in .env");
      }

      setError(null);
      const nextHistory =
        isTradingDayRange && tradingDayEndpoint
          ? await fetchGoldTradingDay(tradingDayEndpoint)
          : await fetchGoldHistory(historyEndpoint, historyRange);

      if (requestId !== latestRequestRef.current) {
        return;
      }

      setHistory(nextHistory);
    } catch (loadError) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to fetch value",
      );
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [historyEndpoint, historyRange, isTradingDayRange, tradingDayEndpoint]);

  useEffect(() => {
    load();
    const intervalId = setInterval(load, refreshIntervalMs);

    return () => clearInterval(intervalId);
  }, [load, refreshIntervalMs]);

  useEffect(() => {
    if (!wsEndpoint) {
      setIsLive(false);
      return;
    }

    let isDisposed = false;

    const connect = () => {
      if (isDisposed) {
        return;
      }

      try {
        const socket = new WebSocket(wsEndpoint);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isDisposed) {
            return;
          }

          setIsLive(true);
          socket.send(
            JSON.stringify({ action: "subscribe", symbol: "XAU/USD" }),
          );
        };

        socket.onmessage = (event) => {
          if (isDisposed) {
            return;
          }

          try {
            const msg = JSON.parse(String(event.data));
            if (msg?.type !== "price" || typeof msg?.price !== "number") {
              return;
            }

            setValue(msg.price);
          } catch {
            // Ignore malformed websocket payloads.
          }
        };

        socket.onclose = () => {
          if (isDisposed) {
            return;
          }

          setIsLive(false);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          if (isDisposed) {
            return;
          }

          setIsLive(false);
        };
      } catch {
        setIsLive(false);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wsEndpoint]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
  }, [load]);

  return {
    value,
    history,
    isLoading,
    isRefreshing,
    isLive,
    error,
    refresh,
  };
}
