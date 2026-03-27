import { Stack } from "expo-router";
import { Image } from "react-native";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
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
