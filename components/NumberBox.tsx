import { Picker } from "@react-native-picker/picker";
import { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";

export type CurrencyUnit = "USD" | "MYR";
export type WeightUnit = "g" | "troy_oz";

type NumberBoxProps = {
  value: number | null;
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  currencyUnit: CurrencyUnit;
  weightUnit: WeightUnit;
  onCurrencyUnitChange: (next: CurrencyUnit) => void;
  onWeightUnitChange: (next: WeightUnit) => void;
};

const currencySymbolByUnit: Record<CurrencyUnit, string> = {
  USD: "$",
  MYR: "RM",
};

const weightLabelByUnit: Record<WeightUnit, string> = {
  g: "g",
  troy_oz: "ozt",
};

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  // Future currency options can be added here, e.g. EUR, GBP, SGD
  { value: "USD", label: "USD" },
  { value: "MYR", label: "MYR" },
];

const weightOptions: { value: WeightUnit; label: string }[] = [
  // Future weight options can be added here, e.g. kg, oz, tael
  { value: "g", label: "g" },
  { value: "troy_oz", label: "ozt" },
];

export function NumberBox({
  value,
  isLoading,
  error,
  currencyUnit,
  weightUnit,
  onCurrencyUnitChange,
  onWeightUnitChange,
}: NumberBoxProps) {
  const isDark = useColorScheme() === "dark";
  const symbol = currencySymbolByUnit[currencyUnit];
  const [activeSelector, setActiveSelector] = useState<
    "currency" | "weight" | null
  >(null);
  const blockOpenUntilRef = useRef(0);
  const isIOS = Platform.OS === "ios";
  const colors = {
    title: isDark ? "#9da5b5" : "#8e8e93",
    valueText: isDark ? "#f5f5f7" : "#1c1c1e",
    unit: isDark ? "#b6bdca" : "#48484a",
    overlay: isDark ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.28)",
    iosCard: isDark ? "#171b24" : "#f7f7f7",
    iosDivider: isDark ? "#2a3040" : "#e5e5ea",
    androidCard: isDark ? "#171b24" : "#ffffff",
    rowDivider: isDark ? "#2a3040" : "#efeff4",
    rowSelectedBg: isDark ? "#252c3a" : "#f3f4f8",
    rowBg: isDark ? "#171b24" : "#ffffff",
    rowText: isDark ? "#f5f5f7" : "#1c1c1e",
    accent: isDark ? "#78a9ff" : "#007aff",
  };

  const openCurrencySelector = () => {
    if (Date.now() < blockOpenUntilRef.current) {
      return;
    }
    setActiveSelector("currency");
  };

  const openWeightSelector = () => {
    if (Date.now() < blockOpenUntilRef.current) {
      return;
    }
    setActiveSelector("weight");
  };

  const closeSelector = () => {
    // Prevent the close tap from propagating to underlying triggers while fade animation ends.
    blockOpenUntilRef.current = Date.now() + 300;
    setActiveSelector(null);
  };

  return (
    <View
      style={{
        paddingHorizontal: 4,
        paddingTop: 8,
        paddingBottom: 4,
        width: "100%",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: colors.title,
          marginBottom: 4,
          fontWeight: "500",
        }}
      >
        XAU price ({currencyUnit} per {weightLabelByUnit[weightUnit]})
      </Text>

      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        {isLoading || error ? (
          <Text
            style={{
              fontSize: 44,
              fontWeight: "700",
              color: colors.valueText,
              letterSpacing: -1,
            }}
          >
            —
          </Text>
        ) : (
          <>
            <Pressable onPress={openCurrencySelector}>
              <Text
                style={{
                  fontSize: 44,
                  fontWeight: "700",
                  color: colors.valueText,
                  letterSpacing: -1,
                }}
              >
                {`${symbol}${value?.toFixed(2) ?? "—"}`}
              </Text>
            </Pressable>

            <Pressable onPress={openWeightSelector}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  color: colors.unit,
                  marginBottom: 6,
                  marginLeft: 6,
                }}
              >
                {`/ ${weightLabelByUnit[weightUnit]}`}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={activeSelector !== null}
        onRequestClose={closeSelector}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
          onPress={closeSelector}
        >
          {isIOS ? (
            <Pressable
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 14,
                backgroundColor: colors.iosCard,
                overflow: "hidden",
              }}
              onPress={() => {
                // Keep modal open when tapping the picker container.
              }}
            >
              <View
                style={{
                  height: 44,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.iosDivider,
                }}
              >
                <Text
                  style={{
                    color: colors.title,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {activeSelector === "currency"
                    ? "Select currency"
                    : "Select weight"}
                </Text>
                <Pressable onPress={closeSelector}>
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>

              {activeSelector === "currency" ? (
                <Picker
                  selectedValue={currencyUnit}
                  onValueChange={(next) =>
                    onCurrencyUnitChange(next as CurrencyUnit)
                  }
                >
                  {currencyOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              ) : (
                <Picker
                  selectedValue={weightUnit}
                  onValueChange={(next) =>
                    onWeightUnitChange(next as WeightUnit)
                  }
                >
                  {weightOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={{
                width: "100%",
                maxWidth: 360,
                borderRadius: 14,
                backgroundColor: colors.androidCard,
                overflow: "hidden",
              }}
              onPress={() => {
                // Keep modal open when tapping inside the list container.
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{
                    color: colors.title,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {activeSelector === "currency"
                    ? "Select currency"
                    : "Select weight"}
                </Text>
              </View>

              {(activeSelector === "currency"
                ? currencyOptions
                : weightOptions
              ).map((option) => {
                const isSelected =
                  activeSelector === "currency"
                    ? option.value === currencyUnit
                    : option.value === weightUnit;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      if (activeSelector === "currency") {
                        onCurrencyUnitChange(option.value as CurrencyUnit);
                      } else {
                        onWeightUnitChange(option.value as WeightUnit);
                      }
                      closeSelector();
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderTopWidth: 1,
                      borderTopColor: colors.rowDivider,
                      backgroundColor: isSelected
                        ? colors.rowSelectedBg
                        : colors.rowBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "700" : "500",
                        color: colors.rowText,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={closeSelector}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: 1,
                  borderTopColor: colors.rowDivider,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.accent,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
