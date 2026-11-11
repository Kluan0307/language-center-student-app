import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { SessionGate } from "../../components/SessionGate";
import { useSession } from "../../providers/SessionProvider";
import { theme as t } from "../../theme/tokens";
const items = [
  { name: "index", title: "Trang chủ", icon: "home-outline" },
  { name: "schedule", title: "Lịch học", icon: "calendar-outline" },
  { name: "learning", title: "Học tập", icon: "book-outline" },
  { name: "tuition", title: "Học phí", icon: "wallet-outline" },
  { name: "profile", title: "Cá nhân", icon: "person-outline" },
] as const;
export default function TabsLayout() {
  const session = useSession();
  return (
    <SessionGate>
      <View style={{ flex: 1 }}>
        {session.preview && (
          <View style={{ backgroundColor: t.colors.primaryLight, padding: 8 }}>
            <Text
              style={{
                color: t.colors.primaryDark,
                textAlign: "center",
                fontSize: 12,
              }}
            >
              Xem trước phát triển • Chưa kết nối dữ liệu
            </Text>
          </View>
        )}
        <Tabs
          screenOptions={{
            headerTitle: "Language Center",
            headerShadowVisible: false,
            headerTitleStyle: { color: t.colors.text, fontWeight: "700" },
            tabBarActiveTintColor: t.colors.primary,
            tabBarInactiveTintColor: t.colors.muted,
            tabBarStyle: { borderTopColor: t.colors.border },
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mở thông báo"
                hitSlop={8}
                onPress={() => router.push("/notifications")}
                style={{ padding: 14 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={t.colors.text}
                />
              </Pressable>
            ),
          }}
        >
          {items.map((item) => (
            <Tabs.Screen
              key={item.name}
              name={item.name}
              options={{
                title: item.title,
                tabBarIcon: ({ focused, size }) => (
                  <Ionicons
                    name={item.icon}
                    size={size}
                    color={focused ? t.colors.primary : t.colors.muted}
                  />
                ),
              }}
            />
          ))}
        </Tabs>
      </View>
    </SessionGate>
  );
}
