import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SessionGate } from '../../components/SessionGate';
import { Button, Card, Heading, InlineNotice, Screen, StateView, textStyles } from '../../components/ui';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import type { Session } from '../../features/learning/types';
import { sessionLabels } from '../../features/learning/types';
import { validId } from '../../features/learning/utils';
import { dateCaption } from '../../features/learning/presentation';
import { supportLink } from '../../features/support/context';
import { theme as t } from '../../theme/tokens';

export default function Detail() { return <SessionGate><Content /></SessionGate>; }
function Content() {
  const { id } = useLocalSearchParams(), key = validId(id);
  const resource = useStudentQuery<Session>(key ? '/academic/student/me/sessions/' + key : null), data = resource.data;
  return <Screen onRefresh={key ? resource.reload : undefined} refreshing={resource.fetching}>
    {!key ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại buổi học." />
      : resource.loading ? <StateView loading title="Đang tải buổi học" description="Vui lòng chờ." />
      : resource.error ? <StateView title="Chưa mở được buổi học" description={resource.error} action={{ title: 'Thử lại', onPress: resource.reload }} />
      : data ? <>
        <Heading title={data.className} subtitle={data.courseName + ' · ' + data.classCode} />
        {data.status === 'CANCELLED' && <InlineNotice tone="danger" title="Buổi học đã hủy" description="Kiểm tra lịch học bù hoặc liên hệ trung tâm để biết thêm thông tin." />}
        <Card><Text style={textStyles.label}>{dateCaption(data.date)}</Text>
          <Text style={{ fontSize: 28, lineHeight: 36, fontWeight: '700', color: t.colors.text }}>{data.startTime?.slice(0, 5) ?? 'Chưa rõ giờ'}{data.endTime ? ' – ' + data.endTime.slice(0, 5) : ''}</Text>
          <Text style={textStyles.body}>{sessionLabels[data.status]} · Giờ Việt Nam (GMT+7){data.isMakeup ? ' · Học bù' : ''}</Text>
        </Card>
        <Card><Fact icon="location-outline" label="Phòng học" value={data.roomName ?? 'Chưa cập nhật'} />
          <Fact icon="person-outline" label="Giáo viên buổi này" value={data.teacherName ?? 'Chưa phân công'} />
          <Fact icon="business-outline" label={data.branch.name} value={data.branch.address ?? 'Chưa cập nhật địa chỉ'} />
        </Card>
        {data.teacherChanged && <InlineNotice title="Thay đổi giáo viên" description="Giáo viên hiển thị ở trên là người được phân công cho buổi này." />}
        {data.legacyEstimated && <InlineNotice tone="warning" title="Thông tin lịch đang được xác minh" description="Liên hệ trung tâm nếu lịch này khác với thông tin bạn nhận được." />}
        <Button title="Xem lớp học" onPress={() => router.push('/enrollments/' + data.enrollmentId)} />
        <Button secondary title="Xem lịch ngày này" onPress={() => router.navigate({ pathname: '/schedule', params: { date: data.date, view: 'day', enrollmentId: String(data.enrollmentId) } })} />
        <Button secondary title="Cần hỗ trợ về buổi này" onPress={() => router.push(supportLink('OTHER', 'SESSION', String(data.sessionId)))} />
      </> : <StateView title="Chưa có dữ liệu" description="Vui lòng chọn lại buổi học." />}
  </Screen>;
}
function Fact({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
    <Ionicons name={icon} size={22} color={t.colors.primary} />
    <View style={{ flex: 1, gap: 4 }}><Text style={textStyles.body}>{label}</Text><Text style={textStyles.label}>{value}</Text></View>
  </View>;
}
