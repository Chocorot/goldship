import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, useColorScheme } from "react-native";

import { GoldPriceChart } from "@/components/GoldPriceChart";
import type { TimeInterval } from "@/components/IntervalTabs";
import { IntervalTabs } from "@/components/IntervalTabs";
import type { CurrencyUnit, WeightUnit } from "@/components/NumberBox";
import { NumberBox } from "@/components/NumberBox";
import { useNumberFeed } from "@/hooks/useNumberFeed";
import { fetchUsdToMyrRate } from "@/services/numberApi";
import {
  GOLD_HISTORY_API,
  GOLD_LATEST_API,
  GOLD_TRADING_DAY_API,
  GOLD_WS_API,
} from "../config/env";

const TROY_OUNCE_TO_GRAM = 31.1034768;

export default function Index() {
  const isDark = useColorScheme() === "dark";
  const pageBg = isDark ? "#07090d" : "#f2f2f7";

  const [isChartInteracting, setIsChartInteracting] = useState(false);
  const [interval, setInterval] = useState<TimeInterval>("1d");
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>("USD");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("troy_oz");
  const [usdToMyrRate, setUsdToMyrRate] = useState<number>(1);
  const { value, history, isLoading, isRefreshing, isLive, error, refresh } =
    useNumberFeed({
      latestEndpoint: GOLD_LATEST_API,
      historyEndpoint: GOLD_HISTORY_API,
      tradingDayEndpoint: GOLD_TRADING_DAY_API,
      wsEndpoint: GOLD_WS_API,
      historyRange: interval,
      refreshIntervalMs: 30000,
    });

  const loadUsdToMyrRate = useCallback(async () => {
    try {
      const nextRate = await fetchUsdToMyrRate();
      setUsdToMyrRate(nextRate);
    } catch {
      // Keep the previous rate when BNM is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    loadUsdToMyrRate();
  }, [loadUsdToMyrRate]);

  const convertPrice = useCallback(
    (usdPerTroyOz: number) => {
      let nextPrice = usdPerTroyOz;

      if (currencyUnit === "MYR") {
        nextPrice *= usdToMyrRate;
      }

      if (weightUnit === "g") {
        nextPrice /= TROY_OUNCE_TO_GRAM;
      }

      return nextPrice;
    },
    [currencyUnit, usdToMyrRate, weightUnit],
  );

  const convertedValue = useMemo(
    () => (value === null ? null : convertPrice(value)),
    [convertPrice, value],
  );
  const convertedHistoryPoints = useMemo(
    () =>
      history.points.map((point) => ({
        ...point,
        price: convertPrice(point.price),
      })),
    [convertPrice, history.points],
  );
  const convertedPreviousClose = useMemo(
    () =>
      typeof history.previousClose === "number"
        ? convertPrice(history.previousClose)
        : undefined,
    [convertPrice, history.previousClose],
  );

  const onPullRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadUsdToMyrRate()]);
  }, [loadUsdToMyrRate, refresh]);

  return (
    <ScrollView
      scrollEnabled={!isChartInteracting}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-start",
        alignItems: "stretch",
        width: "100%",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: pageBg,
      }}
      style={{ backgroundColor: pageBg }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onPullRefresh}
          tintColor={isDark ? "#f5c542" : "#8e8e93"}
          colors={[isDark ? "#f5c542" : "#8e8e93"]}
          progressBackgroundColor={isDark ? "#161a22" : "#ffffff"}
        />
      }
    >
      <NumberBox
        value={convertedValue}
        isLoading={convertedValue === null}
        isLive={isLive}
        error={error}
        currencyUnit={currencyUnit}
        weightUnit={weightUnit}
        onCurrencyUnitChange={setCurrencyUnit}
        onWeightUnitChange={setWeightUnit}
      />
      <IntervalTabs value={interval} onChange={setInterval} />
      <GoldPriceChart
        data={convertedHistoryPoints}
        interval={interval}
        isLoading={isLoading}
        isTradingDay={interval === "1d"}
        tradingDay={history.tradingDay}
        previousClose={convertedPreviousClose}
        onInteractionStart={() => setIsChartInteracting(true)}
        onInteractionEnd={() => setIsChartInteracting(false)}
      />
    </ScrollView>
  );
}
