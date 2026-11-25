import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SessionGate } from '../../components/SessionGate';
import { Button, Card, Heading, InlineNotice, Row, Screen, StateView, textStyles } from '../../components/ui';
import { Badge, Disclosure, Pagination } from '../../components/Details';
import { ClassContext } from '../learning/ClassContext';
import { useStudentQuery } from '../learning/useStudentQuery';
import { displayDate, validId } from '../learning/utils';
import { supportLink } from '../support/context';
import { scoreLabel, percentLabel } from './utils';
export type Grade = { examId: number; examName: string; examType: string; examDate: string; maxScore: number; weight: number; revision: number; publishedAt: string; score: number | null; status: 'GRADED' | 'NOT_GRADED'; studentComment: string | null };
export type Outcome = { state: 'PENDING' | 'CONFIRMED' | 'UPDATING'; outcome: 'PASS' | 'FAIL' | null; revision: number | null; confirmedAt: string | null };
export type Attendance = { sessionId: number | null; attendanceId: number | null; date: string; startTime: string | null; endTime: string | null; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'NOT_RECORDED'; hasPermission: boolean; source: 'VERIFIED' | 'LEGACY_UNVERIFIED' };
export type Summary = { eligibleCompleted: number; present: number; late: number; absent: number; notRecorded: number; legacyUnverified: number; coverageComplete: boolean; attendancePercent: number | null };
type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; summary?: Summary };
const attendanceLabels = { PRESENT: 'Có mặt', ABSENT: 'Vắng', LATE: 'Đi muộn', NOT_RECORDED: 'Chưa cập nhật' };
const examLabels: Record<string, string> = { MIDTERM: 'Giữa khóa', FINAL: 'Cuối khóa', QUIZ: 'Kiểm tra', PLACEMENT: 'Đầu vào' };
export default function Progress({ mode }: { mode: 'grades' | 'attendance' }) { return <SessionGate><Content key={mode + ':' + String(useLocalSearchParams().id)} mode={mode} /></SessionGate>; }
function Content({ mode }: { mode: 'grades' | 'attendance' }) {
  const key = validId(useLocalSearchParams().id), [page, setPage] = useState(0);
  const rows = useStudentQuery<Page<Grade | Attendance>>(key ? `/${mode === 'grades' ? 'teaching' : 'academic'}/student/me/enrollments/${key}/${mode}?page=${page}&size=20` : null);
  const outcome = useStudentQuery<Outcome>(key && mode === 'grades' ? `/teaching/student/me/enrollments/${key}/final-result` : null);
  const data = rows.data;
  return <Screen onRefresh={key ? () => { rows.reload(); outcome.reload(); } : undefined} refreshing={rows.fetching || outcome.fetching}>
    {!key ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại lớp học." /> : <>
      <ClassContext id={key} />
      {mode === 'grades' && <Card><Heading title="Kết quả cuối khóa" />
        {outcome.loading ? <Text style={textStyles.body}>Đang kiểm tra kết quả…</Text>
          : outcome.error ? <InlineNotice title="Chưa tải được kết quả" action={{ title: 'Thử lại', onPress: outcome.reload }} />
          : outcome.data && <><Badge label={outcome.data.state === 'CONFIRMED' && outcome.data.outcome ? outcome.data.outcome === 'PASS' ? 'Đạt' : 'Chưa đạt' : outcome.data.state === 'UPDATING' ? 'Đang cập nhật kết quả' : 'Chưa xác nhận kết quả'}
            tone={outcome.data.state === 'CONFIRMED' && outcome.data.outcome === 'PASS' ? 'success' : 'info'} />
            {outcome.data.confirmedAt && <Text style={textStyles.body}>Xác nhận ngày {displayDate(outcome.data.confirmedAt.slice(0, 10))}</Text>}</>}
      </Card>}
      {rows.loading ? <StateView loading title="Đang tải dữ liệu" description="Vui lòng chờ." />
        : rows.error ? <StateView title="Chưa tải được dữ liệu" description={rows.error} action={{ title: 'Thử lại', onPress: rows.reload }} />
        : data && <>
          {data.summary && <Card><Text style={textStyles.section}>Tổng quan chuyên cần</Text><Text style={[textStyles.section, { fontSize: 26, lineHeight: 34 }]}>{percentLabel(data.summary)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{[['Có mặt', data.summary.present], ['Đi muộn', data.summary.late], ['Vắng', data.summary.absent], ['Chưa cập nhật', data.summary.notRecorded]].map(([label, count]) => <View key={label} style={{ minWidth: 100, gap: 4 }}><Text style={textStyles.body}>{label}</Text><Text style={textStyles.label}>{count}</Text></View>)}</View>
            <Text style={textStyles.body}>{data.summary.eligibleCompleted} buổi đã diễn ra đủ điều kiện.</Text>
            {(!data.summary.coverageComplete || data.summary.legacyUnverified > 0) && <InlineNotice tone="warning" title="Một số dữ liệu đang được xác minh" description="Tỷ lệ chỉ hiển thị khi dữ liệu đủ điều kiện." />}
          </Card>}
          {!data.content.length ? <StateView title={mode === 'grades' ? 'Chưa có điểm được công bố' : 'Chưa có bản ghi chuyên cần'} description={mode === 'grades' ? 'Điểm sẽ hiển thị sau khi trung tâm công bố.' : 'Chưa cập nhật điểm danh không có nghĩa là vắng.'} />
            : data.content.map((item, index) => mode === 'grades' ? <GradeCard key={(item as Grade).examId} grade={item as Grade} /> : <AttendanceCard key={`${(item as Attendance).sessionId}-${index}`} attendance={item as Attendance} />)}
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          {mode === 'attendance' && <Disclosure title="Cách tính chuyên cần"><Text style={textStyles.body}>Đi muộn được tính là tham dự. Vắng có phép vẫn là vắng. Buổi đã hủy, chưa diễn ra và bản ghi cũ chưa xác minh không dùng để tính tỷ lệ.</Text></Disclosure>}
        </>}
      <Card><Row title={mode === 'grades' ? 'Cần kiểm tra điểm?' : 'Cần kiểm tra điểm danh?'} description="Gửi yêu cầu kèm thông tin lớp này" icon="help-circle-outline" onPress={() => router.push(supportLink(mode === 'grades' ? 'GRADE' : 'ATTENDANCE', 'ENROLLMENT', key))} /></Card>
    </>}
  </Screen>;
}
function GradeCard({ grade: g }: { grade: Grade }) {
  return <Card><Text style={textStyles.label}>{g.examName}</Text><Text style={textStyles.body}>{displayDate(g.examDate)} · {examLabels[g.examType] ?? g.examType}</Text>
    <Text style={[textStyles.section, { fontSize: 26, lineHeight: 34 }]}>{scoreLabel(g)}</Text>
    {g.studentComment && <View style={{ gap: 4 }}><Text style={textStyles.label}>Nhận xét của giáo viên</Text><Text style={textStyles.body}>{g.studentComment}</Text></View>}
    <Text style={textStyles.body}>Công bố ngày {displayDate(g.publishedAt.slice(0, 10))}</Text>
  </Card>;
}
function AttendanceCard({ attendance: a }: { attendance: Attendance }) {
  return <Card><Text style={textStyles.label}>{displayDate(a.date)}{a.startTime ? ' · ' + a.startTime.slice(0, 5) + (a.endTime ? ' – ' + a.endTime.slice(0, 5) : '') : ''}</Text>
    <Badge label={attendanceLabels[a.status] + (a.status === 'ABSENT' && a.hasPermission ? ' · Có phép' : '')} tone={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'danger' : 'warning'} />
    {a.source === 'LEGACY_UNVERIFIED' && <Text style={textStyles.body}>Bản ghi đang được xác minh, chưa dùng để tính tỷ lệ.</Text>}
    {a.sessionId && <Button secondary title="Chi tiết buổi học" onPress={() => router.push('/sessions/' + a.sessionId)} />}
  </Card>;
}
