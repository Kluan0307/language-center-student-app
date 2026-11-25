import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SegmentedControl, StateView, textStyles } from '../../components/ui';
import { Badge, Pagination } from '../../components/Details';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import type { Enrollment } from '../../features/learning/types';
import { studyLabels } from '../../features/learning/types';
import { displayDate } from '../../features/learning/utils';
import type { PageResponse } from '../../types/api';
import { theme as t } from '../../theme/tokens';

export default function Learning() {
  const params = useLocalSearchParams();
  const group = params.group === 'HISTORY' ? 'HISTORY' : 'CURRENT';
  const raw = Number(params.page ?? 0), page = Number.isSafeInteger(raw) && raw >= 0 && raw < 100000 ? raw : 0;
  const query = useStudentQuery<PageResponse<Enrollment>>('/academic/student/me/enrollments?group=' + group + '&page=' + page + '&size=20');
  return <Screen onRefresh={query.reload} refreshing={query.fetching}>
    <SegmentedControl value={group} options={[{ value: 'CURRENT', label: 'Lớp hiện tại' }, { value: 'HISTORY', label: 'Lịch sử học' }]}
      onChange={value => router.setParams({ group: value, page: '0' })} />
    <Text style={textStyles.body}>{group === 'CURRENT' ? 'Các lớp đang học hoặc bảo lưu của bạn.' : 'Các lớp trước đây và kết quả đã được công bố.'}</Text>
    {query.loading ? <StateView loading title="Đang tải lớp học" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa tải được lớp học" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : !query.data?.content.length ? <Card><StateView title="Chưa có lớp trong mục này" description="Chọn mục khác hoặc liên hệ trung tâm để kiểm tra đăng ký." icon="school-outline" /></Card>
      : <>{query.data.content.map(enrollment => <Pressable key={enrollment.id} accessibilityRole="button" accessibilityLabel={'Mở lớp ' + enrollment.className + ', ' + enrollment.classCode}
        onPress={() => router.push('/enrollments/' + enrollment.id)} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
        <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1, gap: 4 }}>
          <Text style={textStyles.section}>{enrollment.className}</Text><Text style={textStyles.body}>{enrollment.courseName} · {enrollment.classCode}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={t.colors.muted} /></View>
          <Badge label={studyLabels[enrollment.status]} tone={enrollment.status === 'RESERVED' ? 'warning' : 'info'} />
          <Text style={textStyles.body}>{enrollment.branch.name} · {enrollment.teacherName || 'Chưa phân công giáo viên'}</Text>
          <Text style={textStyles.body}>{displayDate(enrollment.startDate)} – {displayDate(enrollment.endDate)}</Text>
        </Card></Pressable>)}
        <Pagination page={page} totalPages={query.data.totalPages} onChange={value => router.setParams({ page: String(value) })} />
      </>}
  </Screen>;
}
