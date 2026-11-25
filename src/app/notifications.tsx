import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionGate } from '../components/SessionGate';
import { Card, InlineNotice, Screen, SectionTitle, SegmentedControl, StateView, textStyles } from '../components/ui';
import { Pagination } from '../components/Details';
import { useStudentQuery } from '../features/learning/useStudentQuery';
import { useNotificationInbox } from '../providers/NotificationProvider';
import { useNoticeOpen } from '../features/notifications/useNoticeOpen';
import type { Notice } from '../features/notifications/types';
import { displayDate } from '../features/learning/utils';
import { theme as t } from '../theme/tokens';
const categories: Record<string, string> = { SCHEDULE: 'Lịch học', GRADES: 'Điểm số', TUITION: 'Học phí', PAYMENT: 'Thanh toán', DOCUMENTS: 'Tài liệu', SUPPORT: 'Hỗ trợ' };
export default function Notifications() { return <SessionGate><Content /></SessionGate>; }
function Content() {
  const [page, setPage] = useState(0), [filter, setFilter] = useState('all');
  const inbox = useNotificationInbox(), opener = useNoticeOpen();
  const query = useStudentQuery<{ content: Notice[]; totalPages: number; totalElements: number }>('/academic/student/me/notifications?page=' + page + '&size=20' + (filter === 'all' ? '' : '&unread=' + String(filter === 'unread')));
  return <Screen onRefresh={() => { query.reload(); inbox.reload(); }} refreshing={query.fetching}>
    <SectionTitle title={inbox.count === null ? 'Cập nhật từ trung tâm' : inbox.count + ' thông báo chưa đọc'} action={{ title: 'Cài đặt', onPress: () => router.push('/settings') }} />
    <SegmentedControl value={filter} options={[{ value: 'all', label: 'Tất cả' }, { value: 'unread', label: 'Chưa đọc' }, { value: 'read', label: 'Đã đọc' }]} onChange={value => { setFilter(value); setPage(0); }} />
    {inbox.error && <InlineNotice title="Chưa cập nhật được số thông báo mới" />}
    {query.loading ? <StateView loading title="Đang tải thông báo" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa tải được thông báo" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : query.data && <>{!query.data.content.length && <StateView title={filter === 'unread' ? 'Bạn đã xem hết thông báo' : 'Chưa có thông báo phù hợp'} description="Các cập nhật vẫn được lưu tại đây khi bạn chưa bật thông báo trên thiết bị." icon="notifications-outline" />}
        {query.data.content.map(notice => <Pressable key={notice.id} accessibilityRole="button" accessibilityLabel={(notice.readAt ? '' : 'Chưa đọc: ') + notice.title}
          disabled={opener.opening !== null} accessibilityState={{ disabled: opener.opening !== null }} aria-disabled={opener.opening !== null} onPress={() => void opener.open(notice)} style={({ pressed }) => ({ opacity: pressed || opener.opening === notice.id ? 0.6 : 1 })}>
          <Card><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Ionicons name={notice.category === 'SCHEDULE' ? 'calendar-outline' : notice.category === 'PAYMENT' ? 'receipt-outline' : 'notifications-outline'} size={22} color={t.colors.primary} />
            <View style={{ flex: 1, gap: 4 }}><Text style={textStyles.label}>{notice.title}</Text><Text numberOfLines={2} style={textStyles.body}>{notice.body}</Text></View>
            {!notice.readAt && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />}
          </View><Text style={textStyles.body}>{categories[notice.category] ?? 'Trung tâm'} · {displayDate(notice.createdAt.slice(0, 10))} · {notice.createdAt.slice(11, 16)}</Text></Card>
        </Pressable>)}<Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
      </>}
  </Screen>;
}
