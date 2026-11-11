import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../providers/SessionProvider";
import { theme } from "../theme/tokens";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: theme.colors.primary,
            headerTitleStyle: { color: theme.colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ title: "Language Center" }} />
          <Stack.Screen
            name="change-password"
            options={{ title: "Kích hoạt tài khoản" }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ title: "Thông báo" }} />
          <Stack.Screen name="support" options={{ title: "Hỗ trợ học viên" }} />
          <Stack.Screen name="settings" options={{ title: "Cài đặt" }} />
          <Stack.Screen
            name="+not-found"
            options={{ title: "Không tìm thấy" }}
          />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
