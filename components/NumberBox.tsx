import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

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
  troy_oz: "troy oz",
};

const currencyOptions: { value: CurrencyUnit; label: string }[] = [
  // Future currency options can be added here, e.g. EUR, GBP, SGD
  { value: "USD", label: "USD" },
  { value: "MYR", label: "MYR" },
];

const weightOptions: { value: WeightUnit; label: string }[] = [
  // Future weight options can be added here, e.g. kg, oz, tael
  { value: "g", label: "g" },
  { value: "troy_oz", label: "troy oz" },
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
  const symbol = currencySymbolByUnit[currencyUnit];
  const [activeSelector, setActiveSelector] = useState<
    "currency" | "weight" | null
  >(null);
  const isIOS = Platform.OS === "ios";

  const openCurrencySelector = () => {
    setActiveSelector("currency");
  };

  const openWeightSelector = () => {
    setActiveSelector("weight");
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
          color: "#8e8e93",
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
              color: "#1c1c1e",
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
                  color: "#1c1c1e",
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
                  color: "#48484a",
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
        onRequestClose={() => setActiveSelector(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.28)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
          onPress={() => setActiveSelector(null)}
        >
          {isIOS ? (
            <Pressable
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 14,
                backgroundColor: "#f7f7f7",
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
                  borderBottomColor: "#e5e5ea",
                }}
              >
                <Text
                  style={{ color: "#8e8e93", fontSize: 13, fontWeight: "600" }}
                >
                  {activeSelector === "currency"
                    ? "Select currency"
                    : "Select weight"}
                </Text>
                <Pressable onPress={() => setActiveSelector(null)}>
                  <Text
                    style={{
                      color: "#007aff",
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
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
              onPress={() => {
                // Keep modal open when tapping inside the list container.
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{
                    color: "#8e8e93",
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
                      setActiveSelector(null);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderTopWidth: 1,
                      borderTopColor: "#efeff4",
                      backgroundColor: isSelected ? "#f3f4f8" : "#ffffff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isSelected ? "700" : "500",
                        color: "#1c1c1e",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setActiveSelector(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: 1,
                  borderTopColor: "#efeff4",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#007aff",
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
