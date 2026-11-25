import { useNotificationInbox } from '../../providers/NotificationProvider';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SessionGate } from '../../components/SessionGate';
import { IconButton } from '../../components/ui';
import { theme as t } from '../../theme/tokens';
const items = [
  { name: 'index', title: 'Trang chủ', icon: 'home-outline' },
  { name: 'schedule', title: 'Lịch học', icon: 'calendar-outline' },
  { name: 'learning', title: 'Học tập', icon: 'book-outline' },
  { name: 'tuition', title: 'Học phí', icon: 'wallet-outline' },
  { name: 'profile', title: 'Cá nhân', icon: 'person-outline' },
] as const;
export default function TabsLayout() {
  const inbox = useNotificationInbox(), insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return <SessionGate><Tabs screenOptions={{
    headerShadowVisible: false, headerStyle: { backgroundColor: t.colors.surface },
    headerTitleStyle: { color: t.colors.text, fontWeight: '700', fontSize: 19 },
    tabBarActiveTintColor: t.colors.primary, tabBarInactiveTintColor: t.colors.muted,
    tabBarLabelStyle: { fontSize: 12, lineHeight: 18, flexShrink: 0, fontWeight: '600' },
    tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, height: Math.max(72, 48 + Math.ceil(18 * fontScale)) + insets.bottom, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) },
    headerRight: () => <View style={{ marginRight: 12 }}>
      <IconButton icon="notifications-outline" label={inbox.count === null ? 'Mở thông báo' : 'Mở thông báo, ' + inbox.count + ' chưa đọc'} onPress={() => router.push('/notifications')} />
      {inbox.count !== null && inbox.count > 0 && <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, backgroundColor: t.colors.danger, borderRadius: 12, paddingHorizontal: 5, minWidth: 19, minHeight: 19, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>{inbox.count > 99 ? '99+' : inbox.count}</Text>
      </View>}
    </View>,
  }}>{items.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title,
    tabBarAccessibilityLabel: item.title,
    tabBarIcon: ({ focused, size }) => <Ionicons name={item.icon} size={size} color={focused ? t.colors.primary : t.colors.muted} />,
  }} />)}</Tabs></SessionGate>;
}
