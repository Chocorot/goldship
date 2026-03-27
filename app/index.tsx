import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

import { GoldPriceChart } from "@/components/GoldPriceChart";
import { IntervalTabs, TimeInterval } from "@/components/IntervalTabs";
import { CurrencyUnit, NumberBox, WeightUnit } from "@/components/NumberBox";
import { useNumberFeed } from "@/hooks/useNumberFeed";
import {
  GOLD_HISTORY_API,
  GOLD_TRADING_DAY_API,
  GOLD_WS_API,
} from "../config/env";

export default function Index() {
  const [isChartInteracting, setIsChartInteracting] = useState(false);
  const [interval, setInterval] = useState<TimeInterval>("1d");
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>("USD");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("troy_oz");
  const { value, history, isLoading, isRefreshing, isLive, error, refresh } =
    useNumberFeed({
      historyEndpoint: GOLD_HISTORY_API,
      tradingDayEndpoint: GOLD_TRADING_DAY_API,
      wsEndpoint: GOLD_WS_API,
      historyRange: interval,
      refreshIntervalMs: 30000,
    });

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
        backgroundColor: "#f2f2f7",
      }}
      style={{ backgroundColor: "#f2f2f7" }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <NumberBox
        value={value}
        isLoading={value === null}
        isLive={isLive}
        error={error}
        currencyUnit={currencyUnit}
        weightUnit={weightUnit}
        onCurrencyUnitChange={setCurrencyUnit}
        onWeightUnitChange={setWeightUnit}
      />
      <IntervalTabs value={interval} onChange={setInterval} />
      <GoldPriceChart
        data={history.points}
        interval={interval}
        isLoading={isLoading}
        isTradingDay={interval === "1d"}
        tradingDay={history.tradingDay}
        previousClose={history.previousClose}
        onInteractionStart={() => setIsChartInteracting(true)}
        onInteractionEnd={() => setIsChartInteracting(false)}
      />
    </ScrollView>
  );
}
