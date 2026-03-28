import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";

export type TimeInterval =
  | "1h"
  | "5h"
  | "1d"
  | "5d"
  | "1w"
  | "1m"
  | "3m"
  | "6m"
  | "ytd"
  | "1y"
  | "2y"
  | "5y"
  | "10y";

type IntervalTabsProps = {
  value: TimeInterval;
  onChange: (next: TimeInterval) => void;
};

const INTERVAL_OPTIONS: { value: TimeInterval; label: string }[] = [
  { value: "1h", label: "1H" },
  { value: "5h", label: "5H" },
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
  { value: "10y", label: "10Y" },
];

export function IntervalTabs({ value, onChange }: IntervalTabsProps) {
  const isDark = useColorScheme() === "dark";
  const colors = {
    groupBg: isDark ? "#161b24" : "#ebebf0",
    activeBg: isDark ? "#f6f6f8" : "#1c1c1e",
    activeText: isDark ? "#0f1217" : "#ffffff",
    inactiveText: isDark ? "#9aa3b2" : "#5a5a62",
  };

  return (
    <View
      style={{
        width: "100%",
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          backgroundColor: colors.groupBg,
          borderRadius: 999,
          padding: 4,
          gap: 6,
        }}
      >
        {INTERVAL_OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isActive ? colors.activeBg : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isActive ? colors.activeText : colors.inactiveText,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
