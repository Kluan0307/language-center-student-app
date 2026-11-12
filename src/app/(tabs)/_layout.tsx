import {useNotificationInbox} from '../../providers/NotificationProvider';
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionGate } from "../../components/SessionGate";
import { theme as t } from "../../theme/tokens";
const items = [
  { name: "index", title: "Trang chủ", icon: "home-outline" },
  { name: "schedule", title: "Lịch học", icon: "calendar-outline" },
  { name: "learning", title: "Học tập", icon: "book-outline" },
  { name: "tuition", title: "Học phí", icon: "wallet-outline" },
  { name: "profile", title: "Cá nhân", icon: "person-outline" },
] as const;
export default function TabsLayout() {
  const inbox=useNotificationInbox();
  const insets = useSafeAreaInsets();
  return (
    <SessionGate>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerTitle: () => (
              <View style={{ gap: 3 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: t.colors.text,
                  }}
                >
                  Language Center
                </Text>

              </View>
            ),
            headerShadowVisible: false,
            headerTitleStyle: { color: t.colors.text, fontWeight: "700" },
            tabBarActiveTintColor: t.colors.primary,
            tabBarInactiveTintColor: t.colors.muted,
            tabBarStyle: {
              borderTopColor: t.colors.border,
              height: 64 + insets.bottom,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
            },
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={inbox.count===null?"Mở thông báo":"Mở thông báo, "+inbox.count+" chưa đọc"}
                hitSlop={8}
                onPress={() => router.push("/notifications")}
                style={{ padding: 14 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={t.colors.text}
                />
              {inbox.count!==null&&inbox.count>0&&<Text style={{position:'absolute',right:4,top:4,backgroundColor:t.colors.primary,color:'white',borderRadius:12,paddingHorizontal:5,fontSize:11,minWidth:18,textAlign:'center'}}>{inbox.count>99?'99+':inbox.count}</Text>}</Pressable>
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
