import { Stack } from "expo-router";
import { Image, useColorScheme } from "react-native";

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#0f1115" : "#ffffff",
        },
        headerTintColor: isDark ? "#f5f5f7" : "#1c1c1e",
        headerTitle: () => (
          <Image
            source={require("../assets/images/icon.png")}
            resizeMode="contain"
            style={{ width: 40, height: 40 }}
          />
        ),
        headerTitleAlign: "center",
      }}
    />
  );
}
