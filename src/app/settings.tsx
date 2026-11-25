import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Switch, Text, View } from 'react-native';
import { SessionGate } from '../components/SessionGate';
import { Button, Card, InlineNotice, Row, Screen, StateView, textStyles } from '../components/ui';
import { useStudentQuery } from '../features/learning/useStudentQuery';
import { useSession } from '../providers/SessionProvider';
import type { Preferences } from '../features/notifications/types';
import { enableDevice, disableDevice, nativePushSupported } from '../features/notifications/push';
const labels = { pushEnabled: 'Nhận thông báo trên thiết bị', schedule: 'Lịch học', grades: 'Điểm và kết quả', tuition: 'Học phí', payment: 'Phiếu thu và thanh toán', documents: 'Tài liệu học tập', support: 'Yêu cầu hỗ trợ' };
export default function Settings() { return <SessionGate><Content /></SessionGate>; }
function Content() {
  const { api, identity } = useSession(), query = useStudentQuery<Preferences>('/academic/student/me/notification-preferences');
  const [draft, setDraft] = useState<Preferences>(), [busy, setBusy] = useState(false), [message, setMessage] = useState<string>(), [failed, setFailed] = useState(false);
  const active = useRef(0), flight = useRef(false);
  useEffect(() => () => { active.current++; }, [identity?.accountId]);
  useEffect(() => { setDraft(query.data); }, [query.data]);
  const available = !!draft?.pushAvailable && nativePushSupported();
  const changed = !!draft && !!query.data && (Object.keys(labels) as (keyof typeof labels)[]).some(key => draft[key] !== query.data![key]);
  async function save() {
    if (!draft || flight.current || !available || !changed) return;
    const epoch = active.current; flight.current = true; setBusy(true); setMessage(undefined); setFailed(false);
    try {
      const result = await api<Preferences>('/academic/student/me/notification-preferences', { method: 'PUT', body: { pushEnabled: draft.pushEnabled, schedule: draft.schedule, grades: draft.grades, tuition: draft.tuition, payment: draft.payment, documents: draft.documents, support: draft.support, version: draft.version } });
      if (epoch !== active.current) return;
      setDraft(result); query.reload(); setMessage('Đã lưu tùy chọn thông báo.');
      if (!result.pushEnabled && identity?.accountId) try { await disableDevice(api, identity.accountId); } catch { if (epoch === active.current) setMessage('Đã lưu tùy chọn. Thiết bị sẽ đồng bộ khi kết nối lại.'); }
    } catch (e) { if (epoch === active.current) { setFailed(true); setMessage(e instanceof Error ? e.message : 'Chưa lưu được tùy chọn.'); } }
    finally { flight.current = false; if (epoch === active.current) setBusy(false); }
  }
  async function register() {
    if (!identity || flight.current || !available || changed) return;
    const epoch = active.current; flight.current = true; setBusy(true); setMessage(undefined); setFailed(false);
    try { const result = await enableDevice(api, identity.accountId); if (epoch === active.current) setMessage(result); }
    catch (e) { if (epoch === active.current) { setFailed(true); setMessage(e instanceof Error ? e.message : 'Chưa bật được thông báo.'); } }
    finally { flight.current = false; if (epoch === active.current) setBusy(false); }
  }
  return <Screen onRefresh={!changed && !busy ? query.reload : undefined} refreshing={query.fetching}>
    <Card><Row title="Hộp thông báo" description="Lịch học, kết quả, học phí và phản hồi từ trung tâm" icon="notifications-outline" onPress={() => router.push('/notifications')} />
      <Text style={textStyles.body}>Thông báo trong ứng dụng luôn được lưu, kể cả khi bạn không bật thông báo trên thiết bị.</Text></Card>
    {query.loading ? <StateView loading title="Đang tải cài đặt" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa tải được cài đặt" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : draft && (available ? <>
        <Card><Text style={textStyles.section}>Thông báo trên thiết bị</Text>
          {(Object.keys(labels) as (keyof typeof labels)[]).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 16 }}>
            <Text style={[textStyles.body, { flex: 1 }]}>{labels[key]}</Text><Switch accessibilityLabel={labels[key]} value={draft[key]} disabled={busy || !draft.pushEnabled && key !== 'pushEnabled'} onValueChange={value => setDraft({ ...draft, [key]: value })} />
          </View>)}
          <Button title={busy ? 'Đang lưu…' : 'Lưu thay đổi'} disabled={busy || !changed} onPress={() => void save()} />
          {changed && <Button secondary title="Bỏ thay đổi" disabled={busy} onPress={() => setDraft(query.data)} />}
        </Card>
        <Card><Text style={textStyles.label}>Quyền thông báo trên điện thoại</Text><Text style={textStyles.body}>Sau khi lưu tùy chọn, cho phép ứng dụng gửi thông báo trên thiết bị này.</Text>
          <Button title="Cho phép thông báo" disabled={busy || !query.data?.pushEnabled || changed} onPress={() => void register()} /></Card>
      </> : <InlineNotice title="Thông báo trên thiết bị chưa khả dụng" description="Bạn vẫn xem được đầy đủ cập nhật trong hộp thông báo của ứng dụng." />)}
    {message && <InlineNotice tone={failed ? 'warning' : 'info'} title={message} />}
  </Screen>;
}
