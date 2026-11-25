import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Heading, InlineNotice, Row, Screen, SectionTitle, StateView, textStyles } from '../../components/ui';
import { useSession } from '../../providers/SessionProvider';
import { useNotificationInbox } from '../../providers/NotificationProvider';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import { SessionCard } from '../../features/learning/components';
import { dateCaption, homeFeeState } from '../../features/learning/presentation';
import { todayInVietnam } from '../../features/learning/utils';
import type { NextSession } from '../../features/learning/types';
import type { Notice } from '../../features/notifications/types';
import type { Summary } from '../../features/finance/types';
import { formatMoney } from '../../features/finance/utils';
import { theme as t } from '../../theme/tokens';

export default function Home() {
  const session = useSession(), inbox = useNotificationInbox();
  const next = useStudentQuery<NextSession>('/academic/student/me/next-session');
  const fees = useStudentQuery<Summary>('/finance/student/me/tuitions/summary');
  const changes = useStudentQuery<{ content: Notice[] }>('/academic/student/me/notifications?unread=true&category=SCHEDULE&size=2');
  const feeState = fees.data ? homeFeeState(fees.data) : null;
  function refresh() { next.reload(); fees.reload(); changes.reload(); inbox.reload(); }
  return <Screen onRefresh={refresh} refreshing={next.fetching || fees.fetching || changes.fetching}>
    <Heading title={session.identity?.fullName ? 'Chào ' + session.identity.fullName + '!' : 'Chào bạn!'} subtitle={dateCaption(todayInVietnam())} />
    <SectionTitle title="Buổi học tiếp theo" action={{ title: 'Xem lịch', onPress: () => router.navigate('/schedule') }} />
    {next.loading ? <Card><StateView loading title="Đang tải buổi học" description="Lịch học của bạn sẽ xuất hiện tại đây." /></Card>
      : next.error ? <InlineNotice tone="warning" title="Chưa tải được buổi học tiếp theo" description="Bạn có thể thử lại hoặc mở mục Lịch học." action={{ title: 'Thử lại', onPress: next.reload }} />
      : next.data?.session ? <SessionCard session={next.data.session} featured />
      : <Card><StateView title="Chưa có buổi học sắp tới" description="Bạn có thể xem các ngày khác trong Lịch học." icon="calendar-outline" action={{ title: 'Mở lịch học', onPress: () => router.navigate('/schedule') }} /></Card>}

    {changes.error ? <InlineNotice title="Chưa kiểm tra được thay đổi lịch" action={{ title: 'Thử lại', onPress: changes.reload }} />
      : changes.data?.content.length ? <View style={{ gap: 8 }}><SectionTitle title="Thay đổi lịch cần chú ý" />
        <Card>{changes.data.content.map((notice, index) => <Pressable key={notice.id} accessibilityRole="button"
          accessibilityLabel={'Xem thông báo: ' + notice.title} onPress={() => router.push({ pathname: '/notifications/[id]', params: { id: String(notice.id) } })}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 64, gap: 12, paddingVertical: 8,
            borderTopWidth: index ? 1 : 0, borderColor: t.colors.border, opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="calendar-outline" size={22} color={t.colors.warning} />
          <View style={{ flex: 1, gap: 4 }}><Text numberOfLines={2} style={textStyles.label}>{notice.title}</Text><Text numberOfLines={2} style={textStyles.body}>{notice.body}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={t.colors.muted} />
        </Pressable>)}<Button secondary title="Xem thông báo" onPress={() => router.push('/notifications')} /></Card>
      </View> : null}

    {fees.error ? <InlineNotice title="Chưa cập nhật được học phí" description="Mở mục Học phí để kiểm tra các khoản của bạn." action={{ title: 'Xem học phí', onPress: () => router.navigate('/tuition') }} />
      : fees.data && (feeState === 'review' || feeState === 'due') ? <Card>
        <Text accessibilityRole="header" style={textStyles.label}>{feeState === 'review' ? 'Học phí cần xác minh' : 'Học phí cần đóng'}</Text>
        {feeState === 'due' ? <><Text style={{ color: t.colors.text, fontSize: 28, lineHeight: 36, fontWeight: '700' }}>{formatMoney(fees.data.outstanding, fees.data.currency)}</Text>
          <Text style={[textStyles.body, fees.data.overdueCount > 0 && { color: t.colors.danger }]}>{fees.data.overdueCount > 0 ? fees.data.overdueCount + ' khoản đã quá hạn' : 'Xem hạn đóng và chi tiết từng khoản.'}</Text></>
          : <Text style={textStyles.body}>Một số khoản đang được trung tâm kiểm tra. Xem chi tiết để biết thông tin hiện có.</Text>}
        <Button title="Xem học phí" onPress={() => router.navigate('/tuition')} />
      </Card> : null}

    <Card><Row title="Lớp học của tôi" description="Điểm, chuyên cần và tài liệu theo từng lớp" icon="school-outline" onPress={() => router.navigate('/learning')} /></Card>
    {inbox.error && <InlineNotice title="Chưa kiểm tra được thông báo mới" action={{ title: 'Thử lại', onPress: inbox.reload }} />}
  </Screen>;
}
