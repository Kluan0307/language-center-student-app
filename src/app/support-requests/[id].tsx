import { useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { SessionGate } from '../../components/SessionGate';
import { BottomSheet } from '../../components/BottomSheet';
import { Button, Card, InlineNotice, Row, Screen, StateView, textStyles } from '../../components/ui';
import { Badge } from '../../components/Details';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import { validId, displayDate } from '../../features/learning/utils';
import { statusLabels, categoryLabels, useSupportCommand, type Detail } from '../../features/support/model';
import { parseSupportContext, resourceTarget } from '../../features/support/context';
import { theme as t } from '../../theme/tokens';
export default function Page() { const params = useLocalSearchParams(); return <SessionGate><Content key={String(params.id)} /></SessionGate>; }
function Content() {
  const key = validId(useLocalSearchParams().id), query = useStudentQuery<Detail>(key ? '/academic/student/me/support-requests/' + key : null);
  const [message, setMessage] = useState(''), [closing, setClosing] = useState(false);
  const command = useSupportCommand(() => { setMessage(''); setClosing(false); query.reload(); }), data = query.data;
  const context = data ? parseSupportContext({ ...(data.request.resourceType ? { resourceType: data.request.resourceType } : {}), ...(data.request.resourceId ? { resourceId: String(data.request.resourceId) } : {}), ...(data.request.resourceKey ? { resourceKey: data.request.resourceKey } : {}) }) : undefined;
  const target = context?.resource ? resourceTarget(context.resource) : null;
  return <Screen onRefresh={key && !command.busy ? query.reload : undefined} refreshing={query.fetching}>
    {!key ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại yêu cầu." />
      : query.loading ? <StateView loading title="Đang tải yêu cầu" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa mở được yêu cầu" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : data && <>
        <Card><Text style={textStyles.section}>{data.request.subject}</Text><Badge label={statusLabels[data.request.status]} tone={data.request.status === 'RESOLVED' ? 'success' : 'info'} />
          <Text style={textStyles.body}>{categoryLabels[data.request.category]} · Yêu cầu #{data.request.id}</Text>
          {target && <Row title="Thông tin liên quan" description="Lớp học, buổi học hoặc khoản thu đã đính kèm" icon="link-outline" onPress={() => router.push(target as Href)} />}
        </Card>
        {data.messages.map(item => <View key={item.id} style={{ padding: 16, gap: 8, borderRadius: 16, backgroundColor: item.sender === 'STUDENT' ? t.colors.primaryLight : t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
          <Text style={textStyles.label}>{item.sender === 'STUDENT' ? 'Bạn' : 'Trung tâm'}</Text><Text style={[textStyles.body, { color: t.colors.text }]}>{item.message}</Text>
          <Text style={textStyles.body}>{displayDate(item.createdAt.slice(0, 10))} · {item.createdAt.slice(11, 16)}</Text>
        </View>)}
        {command.error && <InlineNotice tone="warning" title="Chưa xác nhận được thao tác" description={command.error} />}
        {command.pending ? <><Button title={command.busy ? 'Đang kiểm tra…' : 'Gửi lại cùng yêu cầu'} disabled={command.busy} onPress={() => void command.send(command.pending!.path, command.pending!.body)} />
          <Button secondary title="Kiểm tra kết quả vừa gửi" disabled={command.busy} onPress={() => void command.recover()} /></>
          : data.request.status !== 'CLOSED' ? <Card><Text style={textStyles.label}>Phản hồi cho trung tâm</Text>
            <TextInput accessibilityLabel="Phản hồi yêu cầu" placeholder="Nhập nội dung phản hồi" multiline maxLength={2000} value={message} onChangeText={setMessage} editable={!command.busy}
              style={{ minHeight: 120, borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, padding: 14, textAlignVertical: 'top', color: t.colors.text }} />
            <Button title={command.busy ? 'Đang gửi…' : 'Gửi phản hồi'} disabled={command.busy || !message.trim()} onPress={() => void command.send('/academic/student/me/support-requests/' + key + '/messages', { version: data.request.version, message: message.trim() })} />
            {data.request.status === 'RESOLVED' && <Text style={textStyles.body}>Phản hồi mới sẽ mở lại yêu cầu để trung tâm tiếp tục hỗ trợ.</Text>}
            <Button secondary title="Đóng yêu cầu" disabled={command.busy} onPress={() => setClosing(true)} />
          </Card> : <InlineNotice title="Yêu cầu đã đóng" description="Bạn có thể gửi yêu cầu mới nếu cần hỗ trợ thêm." />}
        <BottomSheet visible={closing} title="Đóng yêu cầu hỗ trợ?" onClose={() => { if (!command.busy) setClosing(false); }}>
          <Text style={textStyles.body}>Sau khi đóng, bạn sẽ không gửi thêm phản hồi trong yêu cầu này.</Text>
          {command.error && <InlineNotice tone="warning" title="Chưa xác nhận được thao tác đóng" description={command.error} />}
          <Button title="Xác nhận đóng yêu cầu" disabled={command.busy} onPress={() => void command.send('/academic/student/me/support-requests/' + key + '/close', { version: data.request.version })} />
        </BottomSheet>
      </>}
    <Button secondary title="Danh sách yêu cầu" onPress={() => router.navigate('/support')} />
  </Screen>;
}
