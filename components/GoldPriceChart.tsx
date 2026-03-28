import { useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Platform,
  Text,
  View,
  useColorScheme,
} from "react-native";
import {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Svg,
  Text as SvgText,
} from "react-native-svg";

import { TimeInterval } from "@/components/IntervalTabs";
import { GoldPricePoint } from "@/services/numberApi";

type GoldPriceChartProps = {
  data: GoldPricePoint[];
  interval?: TimeInterval;
  isLoading?: boolean;
  isTradingDay?: boolean;
  tradingDay?: string;
  previousClose?: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const MAX_POINTS = 60;
// SVG_HEIGHT is fixed; width is measured dynamically from the container
const SVG_HEIGHT = 200;
const LEFT = 8;
const MIN_RIGHT_GUTTER = 24;
const Y_LABEL_FONT_SIZE = 14;
const TOP = 8;
const BOTTOM = 28;
const DRAW_H = SVG_HEIGHT - TOP - BOTTOM;
const Y_AXIS_PADDING_RATIO = 0.12;
const US_MARKET_TZ = "America/New_York";
const MYT_TZ = "Asia/Kuala_Lumpur";
const US_OPEN_HOUR = 9;
const US_OPEN_MINUTE = 30;
const US_CLOSE_HOUR = 16;
const US_CLOSE_MINUTE = 0;

function downsampleEvenly(
  points: GoldPricePoint[],
  maxPoints: number,
): GoldPricePoint[] {
  if (points.length <= maxPoints) {
    return points;
  }

  const sampled: GoldPricePoint[] = [];
  const lastIdx = points.length - 1;
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round((i / (maxPoints - 1)) * lastIdx);
    sampled.push(points[idx]);
  }

  return sampled;
}

function toMs(ts: number): number {
  return ts < 1e12 ? ts * 1000 : ts;
}

function fmtHour(ts: number): string {
  const d = new Date(toMs(ts));
  return String(d.getHours()).padStart(2, "0");
}

function fmtHourMinute(ts: number): string {
  const d = new Date(toMs(ts));
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtHourMyt(ts: number): string {
  if (
    typeof Intl === "undefined" ||
    typeof Intl.DateTimeFormat !== "function"
  ) {
    return fmtHour(ts);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MYT_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(toMs(ts)));
}

function fmtDayOnly(ts: number): string {
  const d = new Date(toMs(ts));
  return String(d.getDate());
}

function fmtMonthShort(ts: number): string {
  const d = new Date(toMs(ts));
  return d.toLocaleString("en-US", { month: "short" });
}

function fmtYear(ts: number): string {
  const d = new Date(toMs(ts));
  return String(d.getFullYear());
}

function fmtXAxisLabel(
  ts: number,
  interval: TimeInterval,
  isTradingDay: boolean,
): string {
  if (interval === "1h") {
    return fmtHourMinute(ts);
  }

  if (interval === "5h" || interval === "1d") {
    return isTradingDay ? fmtHourMyt(ts) : fmtHour(ts);
  }

  if (interval === "5d" || interval === "1w" || interval === "1m") {
    return fmtDayOnly(ts);
  }

  if (
    interval === "3m" ||
    interval === "6m" ||
    interval === "ytd" ||
    interval === "1y" ||
    interval === "2y" ||
    interval === "5y"
  ) {
    return fmtMonthShort(ts);
  }

  return fmtYear(ts);
}

function fmtTooltip(ts: number): string {
  const d = new Date(toMs(ts));
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mo}/${dd}  ${hh}:${mm}`;
}

function fmtPrice(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

function getRightGutterForLabels(labels: string[]): number {
  const maxChars = labels.reduce(
    (max, label) => Math.max(max, label.length),
    0,
  );
  const estimatedTextWidth = maxChars * (Y_LABEL_FONT_SIZE * 0.62);
  return Math.ceil(Math.max(MIN_RIGHT_GUTTER, estimatedTextWidth + 0));
}

function getTimeZoneOffsetMinutes(timestamp: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(new Date(timestamp));
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return (asUtc - timestamp) / 60000;
}

function zonedDateTimeToUtc(
  tradingDay: string,
  hour: number,
  minute: number,
  timeZone: string,
): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tradingDay);
  if (!m) {
    return null;
  }

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  let utcTs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 2; i += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(utcTs, timeZone);
    const adjusted =
      Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60000;
    if (adjusted === utcTs) {
      break;
    }
    utcTs = adjusted;
  }

  return utcTs;
}

function toTradingDayBounds(
  tradingDay?: string,
): { start: number; end: number } | null {
  if (
    !tradingDay ||
    typeof Intl === "undefined" ||
    typeof Intl.DateTimeFormat !== "function"
  ) {
    return null;
  }

  const start = zonedDateTimeToUtc(
    tradingDay,
    US_OPEN_HOUR,
    US_OPEN_MINUTE,
    US_MARKET_TZ,
  );
  const end = zonedDateTimeToUtc(
    tradingDay,
    US_CLOSE_HOUR,
    US_CLOSE_MINUTE,
    US_MARKET_TZ,
  );

  if (start === null || end === null || end <= start) {
    return null;
  }

  return { start, end };
}

export function GoldPriceChart({
  data,
  interval = "1d",
  isLoading = false,
  isTradingDay = false,
  tradingDay,
  previousClose,
  onInteractionStart,
  onInteractionEnd,
}: GoldPriceChartProps) {
  const isDark = useColorScheme() === "dark";
  const colors = {
    brand: "#f5c542",
    spinner: isDark ? "#9aa3b2" : "#9f9f9f",
    mutedText: isDark ? "#909aab" : "rgba(127, 127, 127, 0.8)",
    tooltipSubtext: isDark ? "#9aa3b2" : "#9f9f9f",
    tickText: isDark ? "#8b97ac" : "#7f7f7f",
    xTick: isDark ? "#838ea2" : "#9f9f9f",
    grid: isDark ? "#8a6b16" : "#d4a017",
    axis: isDark ? "#8a6b16" : "#d4a017",
    prevClose: isDark ? "#8e98ad" : "#6f6f6f",
    pointOutline: isDark ? "#11141b" : "#fff",
  };

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // containerWidth drives re-render so SVG viewBox always matches the real layout width
  const [containerWidth, setContainerWidth] = useState(0);
  const containerWidthRef = useRef(0);
  const sampledRef = useRef<GoldPricePoint[]>([]);
  const pointXsRef = useRef<number[]>([]);

  // Shared position handler — reads only refs so it's safe to close over from panResponder
  const handlePos = (locationX: number) => {
    const pointXs = pointXsRef.current;
    const len = pointXs.length;
    const cw = containerWidthRef.current;
    if (len === 0 || cw === 0) return;

    let nearestIdx = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pointXs.length; i += 1) {
      const distance = Math.abs(pointXs[i] - locationX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIdx = i;
      }
    }

    setActiveIdx(nearestIdx);
  };
  // Store latest handlePos in a ref so panResponder (created once) always calls current version
  const handlePosRef = useRef(handlePos);
  handlePosRef.current = handlePos;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onInteractionStart?.();
        handlePosRef.current(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) =>
        handlePosRef.current(evt.nativeEvent.locationX),
      onPanResponderRelease: () => {
        setActiveIdx(null);
        onInteractionEnd?.();
      },
      onPanResponderTerminate: () => {
        setActiveIdx(null);
        onInteractionEnd?.();
      },
    }),
  ).current;

  // On web, DevTools touch simulation sends touchstart/move events which PanResponder ignores.
  // These handlers cover that case without conflicting with PanResponder on native.
  const webTouchHandlers =
    Platform.OS === "web"
      ? {
          onTouchStart: (e: any) => {
            onInteractionStart?.();
            handlePos(e.nativeEvent.locationX);
          },
          onTouchMove: (e: any) => handlePos(e.nativeEvent.locationX),
          onTouchEnd: () => {
            setActiveIdx(null);
            onInteractionEnd?.();
          },
          onTouchCancel: () => {
            setActiveIdx(null);
            onInteractionEnd?.();
          },
        }
      : {};

  if (data.length === 0) {
    if (isLoading) {
      return (
        <View
          style={{
            paddingTop: 4,
            paddingBottom: 8,
            width: "100%",
            marginBottom: 16,
          }}
        >
          {/* Keep the same reserved tooltip area height so spinner centers in chart space only */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "baseline",
              marginBottom: 8,
              height: 36,
            }}
          />
          <View
            style={{
              width: "100%",
              height: SVG_HEIGHT,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="small" color={colors.spinner} />
          </View>
        </View>
      );
    }

    return (
      <View
        style={{
          paddingTop: 4,
          paddingBottom: 8,
          width: "100%",
          marginBottom: 16,
        }}
      >
        {/* Keep the same reserved tooltip area height as chart mode */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "baseline",
            marginBottom: 8,
            height: 36,
          }}
        />
        <View
          style={{
            width: "100%",
            height: SVG_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.mutedText }}>
            No history data available yet.
          </Text>
        </View>
      </View>
    );
  }

  const sampled = downsampleEvenly(data, MAX_POINTS);
  sampledRef.current = sampled;

  const tradingBounds = isTradingDay ? toTradingDayBounds(tradingDay) : null;

  const prices = sampled.map((p) => p.price);
  if (typeof previousClose === "number") {
    prices.push(previousClose);
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const rawSpan = max - min;
  const padding = Math.max(rawSpan * Y_AXIS_PADDING_RATIO, max * 0.0025, 1);
  const paddedMin = min - padding;
  const paddedMax = max + padding;
  const span = paddedMax - paddedMin || 1;
  const Y_TICKS = 4;
  const yTickLabels = Array.from({ length: Y_TICKS }, (_, i) => {
    const ratio = i / (Y_TICKS - 1);
    const price = paddedMin + ratio * span;
    return fmtPrice(price, 0);
  });
  const rightGutter = getRightGutterForLabels(yTickLabels);

  const tsFirst = sampled[0].timestamp;
  const tsLast = sampled[sampled.length - 1].timestamp;
  const domainStart =
    tradingBounds?.start ?? Math.min(toMs(tsFirst), toMs(tsLast));
  const domainEnd = tradingBounds?.end ?? Math.max(toMs(tsFirst), toMs(tsLast));
  const domainSpan = Math.max(domainEnd - domainStart, 1);
  // Use the measured width; fall back to 320 only before first layout so the chart
  // renders immediately and then snaps to the real size.
  const svgW = containerWidth > 0 ? containerWidth : 320;
  const drawW = svgW - LEFT - rightGutter;

  const toXFromTimestamp = (timestamp: number) => {
    if (sampled.length === 1) {
      return LEFT + drawW / 2;
    }

    const normalized = (toMs(timestamp) - domainStart) / domainSpan;
    const clamped = Math.max(0, Math.min(1, normalized));
    return LEFT + clamped * drawW;
  };

  const toXByIndex = (i: number) =>
    LEFT +
    (sampled.length > 1 ? (i / (sampled.length - 1)) * drawW : drawW / 2);

  const toX = (i: number) =>
    tradingBounds ? toXFromTimestamp(sampled[i].timestamp) : toXByIndex(i);
  const toY = (price: number) =>
    TOP + DRAW_H - ((price - paddedMin) / span) * DRAW_H;

  const pts = sampled.map((p, i) => ({ x: toX(i), y: toY(p.price) }));
  pointXsRef.current = pts.map((pt) => pt.x);

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const fillPath =
    `${linePath}` +
    ` L ${pts[pts.length - 1].x} ${TOP + DRAW_H}` +
    ` L ${pts[0].x} ${TOP + DRAW_H} Z`;

  const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
    return {
      y: toY(paddedMin + (i / (Y_TICKS - 1)) * span),
      label: yTickLabels[i],
    };
  });

  const X_TICKS = 4;
  const xTicks = Array.from({ length: X_TICKS }, (_, i) => {
    const ratio = i / (X_TICKS - 1);
    const ts = domainStart + ratio * domainSpan;
    const mappedX = LEFT + ratio * drawW;
    return {
      x: mappedX,
      label: fmtXAxisLabel(ts, interval, Boolean(tradingBounds)),
    };
  });

  const activePoint =
    activeIdx !== null && activeIdx < sampled.length
      ? sampled[activeIdx]
      : null;

  return (
    <View
      style={{
        paddingTop: 4,
        paddingBottom: 8,
        width: "100%",
        marginBottom: 16,
      }}
    >
      {/* Tooltip bar — always occupies the same height to prevent layout jump */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "baseline",
          marginBottom: 8,
          height: 36,
        }}
      >
        {activePoint ? (
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{ fontSize: 14, color: colors.brand, fontWeight: "700" }}
            >
              {fmtPrice(activePoint.price, 2)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.tooltipSubtext }}>
              {fmtTooltip(activePoint.timestamp)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Chart area */}
      <View
        style={{ width: "100%", height: SVG_HEIGHT }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          containerWidthRef.current = w;
          setContainerWidth(w);
        }}
      >
        {/* SVG fills the exact measured width — no aspect-ratio distortion */}
        <Svg
          width={svgW}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${svgW} ${SVG_HEIGHT}`}
          // style={{
          //   borderWidth: 1,
          //   borderColor: "#d4a017",
          //   borderRadius: 12,
          // }}
        >
          <Defs>
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.brand} stopOpacity="0.30" />
              <Stop offset="100%" stopColor={colors.brand} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {yTicks.map((tick, i) => (
            <Line
              key={`y-${i}`}
              x1={LEFT}
              y1={tick.y}
              x2={svgW - rightGutter}
              y2={tick.y}
              stroke={colors.grid}
              strokeWidth="0.5"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />
          ))}

          {/* Gradient fill */}
          <Path d={fillPath} fill="url(#fillGrad)" />

          {/* Price line */}
          <Path
            d={linePath}
            fill="none"
            stroke={colors.brand}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Previous close reference for trading day */}
          {typeof previousClose === "number" && (
            <>
              <Line
                x1={LEFT}
                y1={toY(previousClose)}
                x2={svgW - rightGutter}
                y2={toY(previousClose)}
                stroke={colors.prevClose}
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.9"
              />
              <SvgText
                x={LEFT + 4}
                y={toY(previousClose) - 4}
                fontSize="11"
                fill={colors.prevClose}
                textAnchor="start"
              >
                {`Prev close ${fmtPrice(previousClose, 2)}`}
              </SvgText>
            </>
          )}

          {/* Crosshair */}
          {activeIdx !== null && activeIdx < pts.length && (
            <>
              <Line
                x1={pts[activeIdx].x}
                y1={TOP}
                x2={pts[activeIdx].x}
                y2={TOP + DRAW_H}
                stroke={colors.brand}
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.9"
              />
              <Circle
                cx={pts[activeIdx].x}
                cy={pts[activeIdx].y}
                r={4}
                fill={colors.brand}
                stroke={colors.pointOutline}
                strokeWidth="1.5"
              />
            </>
          )}

          {/* X-axis tick marks */}
          {xTicks.map((tick, i) => (
            <Line
              key={`x-tick-${i}`}
              x1={tick.x}
              y1={TOP + DRAW_H}
              x2={tick.x}
              y2={TOP + DRAW_H + 4}
              stroke={colors.xTick}
              strokeWidth="1"
            />
          ))}

          {/* X-axis time labels */}
          {xTicks.map((tick, i) => (
            <SvgText
              key={`x-label-${i}`}
              x={tick.x}
              y={SVG_HEIGHT - 6}
              fontSize="14"
              fill={colors.tickText}
              textAnchor="start"
            >
              {tick.label}
            </SvgText>
          ))}

          {/* Y-axis price labels (right side) */}
          {yTicks.map((tick, i) =>
            i === 0 ? null : (
              <SvgText
                key={`y-label-${i}`}
                x={svgW}
                y={tick.y + 11}
                fontSize="14"
                fill={colors.tickText}
                textAnchor="end"
              >
                {tick.label}
              </SvgText>
            ),
          )}

          {/* Right Y-axis rule */}
          <Line
            x1={svgW - rightGutter}
            y1={TOP}
            x2={svgW - rightGutter}
            y2={TOP + DRAW_H}
            stroke={colors.axis}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* X-axis baseline */}
          <Line
            x1={LEFT}
            y1={TOP + DRAW_H}
            x2={svgW - rightGutter}
            y2={TOP + DRAW_H}
            stroke={colors.axis}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </Svg>

        {/* Transparent overlay captures all gestures above the SVG layer */}
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          {...panResponder.panHandlers}
          {...webTouchHandlers}
        />
      </View>
    </View>
  );
}
