import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SessionGate } from '../../components/SessionGate';
import { Button, Card, Heading, InlineNotice, Row, Screen, textStyles, StateView } from '../../components/ui';
import { Badge, Disclosure, Fact } from '../../components/Details';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import type { EnrollmentDetail } from '../../features/learning/types';
import { studyLabels } from '../../features/learning/types';
import { displayDate, validId, todayInVietnam } from '../../features/learning/utils';
import { supportLink } from '../../features/support/context';

export default function Detail() { return <SessionGate><Content /></SessionGate>; }
function Content() {
  const key = validId(useLocalSearchParams().id);
  const query = useStudentQuery<EnrollmentDetail>(key ? '/academic/student/me/enrollments/' + key : null), data = query.data;
  return <Screen onRefresh={key ? query.reload : undefined} refreshing={query.fetching}>
    {!key ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại lớp học." />
      : query.loading ? <StateView loading title="Đang tải lớp học" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa mở được lớp học" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : data ? <>
        <Heading title={data.enrollment.className} subtitle={data.enrollment.courseName + ' · ' + data.enrollment.classCode} />
        <Card><Badge label={studyLabels[data.enrollment.status]} tone={data.enrollment.status === 'RESERVED' ? 'warning' : 'info'} />
          {data.enrollment.classification?.programName&&<Fact label="Chương trình" value={data.enrollment.classification.programName}/>}
          {!!data.enrollment.classification?.audiences?.length&&<Fact label="Đối tượng phù hợp của khóa" value={data.enrollment.classification.audiences.map(a=>a.name).join(', ')}/>}
          <Fact label="Chi nhánh" value={data.enrollment.branch.name} />
          <Fact label="Giáo viên của lớp" value={data.enrollment.teacherName} />
          <Text style={textStyles.body}>{displayDate(data.enrollment.startDate)} – {displayDate(data.enrollment.endDate)}</Text>
          <Button title="Xem lịch lớp này" onPress={() => router.navigate({ pathname: '/schedule', params: { enrollmentId: key, date: todayInVietnam(), view: 'agenda' } })} />
        </Card>
        <Card><Row title="Điểm và kết quả" description="Điểm đã công bố, kết quả cuối khóa" icon="ribbon-outline" onPress={() => router.push('/grades/' + key)} />
          <Row title="Chuyên cần" description="Lịch sử điểm danh theo buổi học" icon="checkmark-done-outline" onPress={() => router.push('/attendance/' + key)} />
          <Row title="Tài liệu lớp học" description="Tài liệu trung tâm đã chia sẻ" icon="documents-outline" onPress={() => router.push({ pathname: '/documents', params: { enrollmentId: key } })} />
          <Row title="Học phí của lớp" description="Khoản cần đóng và phiếu thu liên quan" icon="wallet-outline" onPress={() => router.navigate({ pathname: '/tuition', params: { enrollmentId: key, tab: 'due' } })} />
        </Card>
        <Disclosure title="Thông tin và lịch sử lớp học"><Fact label="Phòng của lớp" value={data.enrollment.roomName} />
          <Fact label="Địa chỉ" value={data.enrollment.branch.address} />
          <Text style={textStyles.body}>Phòng và giáo viên thực tế được hiển thị trong từng buổi học.</Text>
          {data.coverage !== 'VERIFIED_PERIODS' && <InlineNotice tone="warning" title="Thời gian theo học đang được xác minh" description="Một số thông tin lịch sử chưa đầy đủ. Liên hệ trung tâm nếu cần kiểm tra." />}
          <Text style={textStyles.label}>Thời gian theo học</Text>
          {data.periods.map((period, index) => <Text key={index} style={textStyles.body}>{displayDate(period.activeFrom)} → {period.activeUntil ? 'trước ' + displayDate(period.activeUntil) : 'Đang có hiệu lực'}</Text>)}
          <Text style={textStyles.label}>Lịch sử đăng ký</Text>
          {!data.publicEvents.length && <Text style={textStyles.body}>Chưa có thay đổi được ghi nhận.</Text>}
          {data.publicEvents.map((event, index) => <View key={index} style={{ gap: 4 }}><Text style={textStyles.body}>{displayDate(event.effectiveDate)} · {studyLabels[event.newStatus as keyof typeof studyLabels] ?? 'Cập nhật đăng ký'}</Text>
            {event.expectedReturnDate && <Text style={textStyles.body}>Dự kiến trở lại: {displayDate(event.expectedReturnDate)}</Text>}</View>)}
        </Disclosure>
        <Card><Row title="Hỗ trợ về lớp này" description="Thông tin lớp được đính kèm yêu cầu" icon="help-circle-outline" onPress={() => router.push(supportLink('OTHER', 'ENROLLMENT', key))} /></Card>
      </> : null}
  </Screen>;
}
