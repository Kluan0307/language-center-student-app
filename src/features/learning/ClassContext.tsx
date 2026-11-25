import { router } from 'expo-router';
import { Row, Card, InlineNotice, textStyles } from '../../components/ui';
import { Text } from 'react-native';
import { useStudentQuery } from './useStudentQuery';
import type { EnrollmentDetail } from './types';

export function ClassContext({ id }: { id: string | null }) {
  const query = useStudentQuery<EnrollmentDetail>(id ? '/academic/student/me/enrollments/' + id : null);
  if (!id) return null;
  if (query.loading) return <Text style={textStyles.body}>Đang tải thông tin lớp…</Text>;
  if (query.error) return <InlineNotice title="Chưa tải được tên lớp" action={{ title: 'Thử lại', onPress: query.reload }} />;
  return query.data ? <Card><Row title={query.data.enrollment.className} description={query.data.enrollment.courseName + ' · ' + query.data.enrollment.classCode}
    icon="school-outline" onPress={() => router.navigate({ pathname: '/enrollments/[id]', params: { id } })} /></Card> : null;
}
