import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card, textStyles } from '../../components/ui';
import { theme as t } from '../../theme/tokens';
import type { Session } from './types';
import { sessionLabels } from './types';
import { dateCaption } from './presentation';

export function SessionCard({ session: s, featured = false }: { session: Session; featured?: boolean }) {
  const cancelled = s.status === 'CANCELLED';
  const color = cancelled ? t.colors.danger : s.status === 'COMPLETED' ? t.colors.success : t.colors.primary;
  const backgroundColor = cancelled ? t.colors.dangerLight : s.status === 'COMPLETED' ? t.colors.successLight : t.colors.primaryLight;
  return <Pressable accessibilityRole="button" accessibilityLabel={'Xem buổi ' + s.className + ', ' + dateCaption(s.date) + ', ' + (s.startTime?.slice(0, 5) ?? 'chưa rõ giờ') + ', ' + sessionLabels[s.status]}
    onPress={() => router.push('/sessions/' + s.sessionId)} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <Text style={{ color: t.colors.text, fontSize: featured ? 24 : 20, lineHeight: featured ? 32 : 28, fontWeight: '700' }}>
          {s.startTime?.slice(0, 5) ?? 'Chưa rõ giờ'}{s.endTime ? ' – ' + s.endTime.slice(0, 5) : ''}
        </Text>
        <View style={{ backgroundColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color, fontSize: 13, fontWeight: '600' }}>{sessionLabels[s.status]}</Text></View>
      </View>
      <View style={{ gap: 4 }}><Text style={textStyles.label}>{s.className}</Text>
        <Text style={textStyles.body}>{dateCaption(s.date)} · {s.branch.name}</Text></View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}><Ionicons name="location-outline" size={19} color={t.colors.muted} /><Text style={[textStyles.body, { flex: 1 }]}>{s.roomName ?? 'Chưa cập nhật phòng'}</Text></View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}><Ionicons name="person-outline" size={19} color={t.colors.muted} /><Text style={[textStyles.body, { flex: 1 }]}>{s.teacherName ?? 'Chưa phân công giáo viên'}</Text></View>
      {(s.isMakeup || s.teacherChanged) && <Text style={{ fontSize: 14, lineHeight: 21, color: t.colors.primary }}>{[s.isMakeup ? 'Học bù' : null, s.teacherChanged ? 'Đổi giáo viên' : null].filter(Boolean).join(' · ')}</Text>}
      {cancelled && <Text style={{ color: t.colors.danger, fontSize: 14, lineHeight: 21 }}>Buổi này đã hủy. Kiểm tra lịch bù hoặc liên hệ trung tâm.</Text>}
      {s.legacyEstimated && <Text style={textStyles.body}>Trung tâm đang xác minh thông tin lịch học này.</Text>}
      {featured && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ color: t.colors.primary, fontWeight: '600', fontSize: 15 }}>Chi tiết buổi học</Text><Ionicons name="arrow-forward" size={18} color={t.colors.primary} /></View>}
    </Card>
  </Pressable>;
}
