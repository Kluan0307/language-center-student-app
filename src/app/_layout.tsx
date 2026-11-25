import { StudentQueryProvider } from '../providers/StudentQueryProvider';
import {NotificationProvider} from '../providers/NotificationProvider';
﻿import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../providers/SessionProvider";
import { theme } from "../theme/tokens";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider><StudentQueryProvider><NotificationProvider>
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
          <Stack.Screen
            name="enrollments/[id]"
            options={{ title: "Lớp học của tôi" }}
          />
          <Stack.Screen
            name="sessions/[id]"
            options={{ title: "Chi tiết buổi học" }}
          />
          <Stack.Screen name="grades/[id]" options={{title:"Điểm & kết quả"}}/>
          <Stack.Screen name="attendance/[id]" options={{title:"Chuyên cần"}}/>
          <Stack.Screen name="documents" options={{title:"Tài liệu học tập"}}/>
          <Stack.Screen name="contact" options={{title:"Liên hệ trung tâm"}}/>
          <Stack.Screen name="support-requests/[id]" options={{title:"Yêu cầu hỗ trợ"}}/>
          <Stack.Screen name="tuitions/[id]" options={{title:"Chi tiết học phí"}}/>
          <Stack.Screen name="receipts" options={{title:"Lịch sử phiếu thu"}}/>
          <Stack.Screen name="receipts/[id]" options={{title:"Chi tiết phiếu thu"}}/>
          <Stack.Screen name="payment-orders" options={{title:"Giao dịch online"}}/>
          <Stack.Screen name="payment-orders/[id]" options={{title:"Kết quả thanh toán"}}/>
          <Stack.Screen name="notifications/[id]" options={{title:"Chi tiết thông báo"}}/>
          <Stack.Screen name="notifications" options={{ title: "Thông báo" }} />
          <Stack.Screen name="support" options={{ title: "Hỗ trợ học viên" }} />
          <Stack.Screen name="settings" options={{ title: "Cài đặt" }} />
          <Stack.Screen
            name="+not-found"
            options={{ title: "Không tìm thấy" }}
          />
        </Stack>
      </NotificationProvider></StudentQueryProvider></SessionProvider>
    </SafeAreaProvider>
  );
}
