import { useSyncExternalStore } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStudentQueries } from '../providers/StudentQueryProvider';
import { useSession } from '../providers/SessionProvider';
import { theme as t } from '../theme/tokens';
export function QueryFeedback() {
  const client = useStudentQueries(), session = useSession();
  const activity = useSyncExternalStore(client.subscribeActivity, client.getActivity, client.getActivity);
  const warning = session.status === 'authenticated' && session.message;
  if (!activity.staleCount && !warning) return null;
  const when = activity.updatedAt ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(activity.updatedAt)) : null;
  return <View accessibilityLiveRegion="polite" style={{ padding: 12, gap: 8, borderRadius: 12, backgroundColor: t.colors.warningLight }}>
    <Text style={{ fontSize: 15, lineHeight: 22, fontWeight: '600', color: t.colors.warning }}>Chưa cập nhật được thông tin mới</Text>
    <Text style={{ fontSize: 14, lineHeight: 21, color: t.colors.text }}>{warning || 'Bạn đang xem thông tin đã tải trước đó.'}{when ? '\nCập nhật gần nhất: ' + when + ' (giờ Việt Nam).' : ''}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Thử cập nhật thông tin" onPress={() => { if (warning) session.retry(); client.retryActive(); }}
      style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: t.colors.primary, fontWeight: '600', fontSize: 15 }}>Thử cập nhật</Text></Pressable>
  </View>;
}
