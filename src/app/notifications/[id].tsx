import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SessionGate } from '../../components/SessionGate';
import { Button, Card, Heading, InlineNotice, Screen, StateView, textStyles } from '../../components/ui';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import { validId, displayDate } from '../../features/learning/utils';
import { noticeTarget, type Notice } from '../../features/notifications/types';
import { useSession } from '../../providers/SessionProvider';
import { useNotificationInbox } from '../../providers/NotificationProvider';
export default function NoticeDetail() { const params = useLocalSearchParams(); return <SessionGate><Content key={String(params.id)} /></SessionGate>; }
function Content() {
  const id = validId(useLocalSearchParams().id), { api, identity } = useSession(), inbox = useNotificationInbox();
  const query = useStudentQuery<Notice>(id ? '/academic/student/me/notifications/' + id : null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>(), [marked, setMarked] = useState(false);
  const attempted = useRef(false), active = useRef(0), flight = useRef(false);
  useEffect(() => () => { active.current++; }, [identity?.accountId]);
  async function markRead() {
    if (!id || flight.current) return;
    const epoch = active.current; flight.current = true; setBusy(true); setError(undefined);
    try { await api('/academic/student/me/notifications/' + id + '/read', { method: 'PUT' }); if (epoch === active.current) { setMarked(true); inbox.reload(); } }
    catch { if (epoch === active.current) setError('Chưa lưu được trạng thái đã đọc. Bạn vẫn có thể mở nội dung liên quan.'); }
    finally { flight.current = false; if (epoch === active.current) setBusy(false); }
  }
  useEffect(() => { if (query.data && !query.data.readAt && !attempted.current) { attempted.current = true; void markRead(); } }, [query.data?.id]);
  const target = query.data ? noticeTarget(query.data) : null;
  return <Screen onRefresh={id ? query.reload : undefined} refreshing={query.fetching}>
    {!id ? <StateView title="Đường dẫn không hợp lệ" description="Mở lại từ danh sách thông báo." />
      : query.loading ? <StateView loading title="Đang tải thông báo" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa mở được thông báo" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : query.data && <><Heading title={query.data.title} subtitle={displayDate(query.data.createdAt.slice(0, 10)) + ' · ' + query.data.createdAt.slice(11, 16)} />
        <Card><Text style={[textStyles.body, { color: '#1F2937' }]}>{query.data.body}</Text><Text style={textStyles.body}>{marked || query.data.readAt ? 'Đã đọc' : busy ? 'Đang lưu trạng thái…' : 'Chưa đọc'}</Text></Card>
        {target && <Button title="Mở nội dung liên quan" onPress={() => router.push(target as Href)} />}
      </>}
    {error && <InlineNotice title="Chưa cập nhật được trạng thái thông báo" description={error} action={{ title: 'Thử lại', onPress: () => { void markRead(); } }} />}
    <Button secondary title="Danh sách thông báo" onPress={() => router.navigate('/notifications')} />
  </Screen>;
}
