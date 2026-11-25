import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { SessionGate } from '../components/SessionGate';
import { Choice } from '../components/Choice';
import { Button, Card, Heading, InlineNotice, Row, Screen, StateView, textStyles } from '../components/ui';
import { Badge, Pagination } from '../components/Details';
import { useStudentQuery } from '../features/learning/useStudentQuery';
import { categoryLabels, statusLabels, useSupportCommand, type Ticket } from '../features/support/model';
import { contextBody, parseSupportContext, resourceApi, resourceLabel, type SupportResource, type SupportCategory } from '../features/support/context';
import { displayDate } from '../features/learning/utils';
import type { Enrollment } from '../features/learning/types';
import { theme as t } from '../theme/tokens';
const input = { borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, padding: 14, color: t.colors.text, backgroundColor: t.colors.surface, minHeight: 48 };
export default function Support() {
  const params = useLocalSearchParams();
  return <SessionGate><Content key={[params.category, params.resourceType, params.resourceId, params.resourceKey].join(':')} /></SessionGate>;
}
function Content() {
  const context = parseSupportContext(useLocalSearchParams());
  const [creating, setCreating] = useState(!!context.resource || context.category !== 'OTHER'), [page, setPage] = useState(0), [status, setStatus] = useState('');
  const query = useStudentQuery<{ content: Ticket[]; totalPages: number }>(creating || context.invalid ? null : '/academic/student/me/support-requests?page=' + page + '&size=20' + (status ? '&status=' + status : ''));
  return <Screen onRefresh={!creating && !context.invalid ? query.reload : undefined} refreshing={query.fetching}>
    {context.invalid ? <StateView title="Thông tin liên quan không hợp lệ" description="Mở lại yêu cầu từ lớp học, buổi học hoặc khoản thu của bạn." action={{ title: 'Về danh sách yêu cầu', onPress: () => router.replace('/support') }} />
      : creating ? <><Heading title="Bạn cần hỗ trợ gì?" subtitle="Trung tâm sẽ phản hồi trong mục yêu cầu của bạn." />
        <Create resource={context.resource} initialCategory={context.category} onSaved={() => { setCreating(false); query.reload(); }} />
        <Button secondary title="Về danh sách yêu cầu" onPress={() => setCreating(false)} />
      </> : <>
        <Card><Row title="Liên hệ chi nhánh" description="Thông tin liên hệ của trung tâm" icon="call-outline" onPress={() => router.push('/contact')} /></Card>
        <Button title="Gửi yêu cầu mới" onPress={() => setCreating(true)} />
        <Choice title="Trạng thái" value={status} options={[{ value: '', label: 'Tất cả' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} onChange={value => { setStatus(value); setPage(0); }} />
        {query.loading ? <StateView loading title="Đang tải yêu cầu" description="Vui lòng chờ." />
          : query.error ? <StateView title="Chưa tải được yêu cầu" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
          : query.data && <>{!query.data.content.length && <StateView title="Chưa có yêu cầu phù hợp" description="Gửi yêu cầu mới để được trung tâm hỗ trợ." icon="chatbubbles-outline" />}
            {query.data.content.map(ticket => <Card key={ticket.id}><Text style={textStyles.section}>{ticket.subject}</Text><Badge label={statusLabels[ticket.status]} tone={ticket.status === 'RESOLVED' ? 'success' : 'info'} />
              <Text style={textStyles.body}>{categoryLabels[ticket.category]} · Cập nhật {displayDate(ticket.updatedAt.slice(0, 10))}</Text>
              <Button secondary title="Xem yêu cầu" onPress={() => router.push('/support-requests/' + ticket.id)} /></Card>)}
            <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
          </>}
      </>}
  </Screen>;
}
function Create({ resource, initialCategory, onSaved }: { resource?: SupportResource; initialCategory: SupportCategory; onSaved: () => void }) {
  const subjects: Record<SupportCategory, string> = { PROFILE: 'Cập nhật thông tin hồ sơ', GRADE: 'Kiểm tra điểm học tập', ATTENDANCE: 'Kiểm tra điểm danh', PAYMENT: 'Kiểm tra thanh toán học phí', LEAVE: 'Xin nghỉ buổi học', MAKEUP: 'Hỗ trợ lịch học bù', OTHER: '' };
  const [category, setCategory] = useState(initialCategory), [subject, setSubject] = useState(subjects[initialCategory]), [description, setDescription] = useState(''), [enrollment, setEnrollment] = useState('');
  const classes = useStudentQuery<Enrollment[]>(resource ? null : '/academic/student/me/enrollments?group=ALL', true);
  const linked = useStudentQuery<{ enrollment?: { className: string }; tuition?: { enrollmentLabel: string }; className?: string; fullName?: string; displayCode?: string }>(resource ? resourceApi(resource) : null);
  const linkedTitle = linked.data?.enrollment?.className ?? linked.data?.tuition?.enrollmentLabel ?? linked.data?.className ?? linked.data?.fullName ?? linked.data?.displayCode;
  const command = useSupportCommand(data => { onSaved(); router.push('/support-requests/' + data.request.id); });
  const locked = command.busy || !!command.pending;
  const financial = resource && ['TUITION', 'RECEIPT', 'PAYMENT_ORDER', 'PROFILE'].includes(resource.type);
  return <Card>{resource && <InlineNotice title={linkedTitle ?? resourceLabel(resource)} description={linked.loading ? 'Đang kiểm tra thông tin đính kèm…' : 'Thông tin này sẽ được đính kèm yêu cầu.'} />}
    {linked.error && <InlineNotice tone="warning" title="Chưa kiểm tra được thông tin đính kèm" description="Thử lại hoặc mở lại từ thông tin bạn muốn được hỗ trợ." action={{ title: 'Thử lại', onPress: linked.reload }} />}
    <Choice title="Nội dung hỗ trợ" value={category} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} disabled={locked || !!financial} onChange={value => setCategory(value as SupportCategory)} />
    <Text style={textStyles.label}>Tiêu đề</Text><TextInput accessibilityLabel="Tiêu đề yêu cầu" placeholder="Tóm tắt vấn đề của bạn" value={subject} onChangeText={setSubject} maxLength={120} style={input} editable={!locked} />
    <Text style={textStyles.label}>Mô tả</Text><TextInput accessibilityLabel="Nội dung yêu cầu" placeholder="Bạn gặp vấn đề gì? Cung cấp thông tin để trung tâm kiểm tra." value={description} onChangeText={setDescription} maxLength={2000} multiline style={[input, { minHeight: 140, textAlignVertical: 'top' }]} editable={!locked} />
    {!resource && <><Choice title="Lớp liên quan" value={enrollment} options={[{ value: '', label: 'Không chọn lớp' }, ...(classes.data ?? []).map(item => ({ value: String(item.id), label: item.className + ' · ' + item.classCode }))]} disabled={locked} onChange={setEnrollment} />
      {classes.error && <Text style={textStyles.body}>Chưa tải được lớp. Bạn vẫn có thể gửi yêu cầu không liên kết lớp.</Text>}</>}
    {command.error && <InlineNotice tone="warning" title="Chưa xác nhận được kết quả gửi" description={command.error} />}
    <Button title={command.busy ? 'Đang gửi…' : command.pending ? 'Gửi lại cùng yêu cầu' : 'Gửi yêu cầu'} disabled={command.busy || !command.pending && (subject.trim().length < 5 || description.trim().length < 10 || !!resource && !linked.data)}
      onPress={() => void command.send('/academic/student/me/support-requests', { category, subject: subject.trim(), description: description.trim(), ...contextBody(resource ?? (enrollment ? { type: 'ENROLLMENT', id: enrollment } : undefined)) })} />
    {command.pending && <Button secondary title="Kiểm tra kết quả vừa gửi" disabled={command.busy} onPress={() => void command.recover()} />}
    <Text style={textStyles.body}>Tiêu đề ít nhất 5 ký tự, mô tả ít nhất 10 ký tự. Không gửi mật khẩu, OTP hoặc thông tin thẻ.</Text>
  </Card>;
}
