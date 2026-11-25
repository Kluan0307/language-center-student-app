import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet';
import { Button, Card, IconButton, Screen, SectionTitle, SegmentedControl, StateView, textStyles } from '../../components/ui';
import { useStudentQuery } from '../../features/learning/useStudentQuery';
import { addDays, dateWindow, displayDate, scheduleParams, todayInVietnam, weekStart } from '../../features/learning/utils';
import { dateCaption, groupSessions } from '../../features/learning/presentation';
import type { Enrollment, Session } from '../../features/learning/types';
import { SessionCard, WeekGrid } from '../../features/learning/components';
import { WeekStrip } from '../../features/learning/WeekStrip';
import { theme as t } from '../../theme/tokens';

export default function Schedule() {
  const params = useLocalSearchParams(), state = scheduleParams(params);
  const window = dateWindow(state.date, state.view), first = weekStart(state.date);
  const [filter, setFilter] = useState(false);
  const classes = useStudentQuery<Enrollment[]>('/academic/student/me/enrollments?group=ALL', true);
  const resource = useStudentQuery<Session[]>('/academic/student/me/schedule?from=' + window.from + '&to=' + window.to + (state.enrollmentId ? '&enrollmentId=' + state.enrollmentId : ''), true);
  const selected = classes.data?.find(e => String(e.id) === state.enrollmentId);
  const groups = groupSessions(resource.data ?? []);
  const update = (values: Record<string, string>) => router.setParams(values);
  function selectClass(id: string) { update({ enrollmentId: id }); setFilter(false); }
  return <Screen onRefresh={() => { resource.reload(); classes.reload(); }} refreshing={resource.fetching || classes.fetching}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon="chevron-back" label="Tuần trước" onPress={() => update({ date: addDays(state.date, -7) })} />
      <Text accessibilityRole="header" style={[textStyles.label, { flex: 1, textAlign: 'center' }]}>{displayDate(first)} – {displayDate(addDays(first, 6))}</Text>
      <IconButton icon="chevron-forward" label="Tuần sau" onPress={() => update({ date: addDays(state.date, 7) })} />
    </View>
    <WeekStrip date={state.date} onSelect={date => update({ date, ...(state.view === 'agenda' ? { view: 'day' } : {}) })} />
    <SegmentedControl value={state.view} options={[{ value: 'day', label: 'Ngày' }, { value: 'agenda', label: 'Tuần' }, { value: 'week', label: 'Lưới giờ' }]}
      onChange={view => update({ view })} />
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
      <View style={{ flex: 1 }}><Button secondary title={state.enrollmentId ? selected?.className ?? 'Lớp đang lọc' : 'Tất cả lớp'} onPress={() => setFilter(true)} /></View>
      <Button secondary title="Hôm nay" onPress={() => update({ date: todayInVietnam() })} />
    </View>
    <Text style={textStyles.body}>Giờ Việt Nam · GMT+7{state.enrollmentId ? ' · Đang lọc một lớp' : ''}</Text>
    {!resource.enabled ? <Card><StateView title="Đăng nhập để xem lịch" description="Lịch cá nhân chỉ hiển thị với tài khoản học viên." /></Card>
      : resource.loading ? <Card><StateView loading title="Đang tải lịch học" description="Các buổi học sẽ xuất hiện tại đây." /></Card>
      : resource.error ? <Card><StateView title="Chưa tải được lịch" description={resource.error} action={{ title: 'Thử lại', onPress: resource.reload }} />
        {state.enrollmentId && <Button title="Bỏ bộ lọc lớp" secondary onPress={() => update({ enrollmentId: '' })} />}</Card>
      : !resource.data?.length ? <Card><StateView title={state.view === 'day' ? 'Không có buổi học ngày này' : 'Không có buổi học trong tuần này'}
        description="Chọn ngày khác để xem lịch học của bạn." icon="calendar-outline" />
        {state.enrollmentId && <Button title="Xem tất cả lớp" secondary onPress={() => update({ enrollmentId: '' })} />}</Card>
      : state.view === 'week' ? <WeekGrid from={window.from} sessions={resource.data} focusDate={state.date} />
      : groups.map(group => <View key={group.date} style={{ gap: 12 }}><SectionTitle title={dateCaption(group.date)} />
        {group.sessions.map(session => <SessionCard key={session.sessionId} session={session} />)}
      </View>)}

    <BottomSheet visible={filter} title="Lọc theo lớp học" onClose={() => setFilter(false)}>
      <ClassOption title="Tất cả lớp của tôi" selected={!state.enrollmentId} onPress={() => selectClass('')} />
      {classes.loading && <Text style={textStyles.body}>Đang tải lớp học…</Text>}
      {classes.error && <StateView title="Chưa tải được danh sách lớp" description={classes.error} action={{ title: 'Thử lại', onPress: classes.reload }} />}
      {classes.data?.map(enrollment => <ClassOption key={enrollment.id} title={enrollment.className}
        description={enrollment.classCode + ' · ' + enrollment.branch.name} selected={String(enrollment.id) === state.enrollmentId} onPress={() => selectClass(String(enrollment.id))} />)}
      {classes.data?.length === 0 && <Text style={textStyles.body}>Bạn chưa có lớp học.</Text>}
    </BottomSheet>
  </Screen>;
}
function ClassOption({ title, description, selected, onPress }: { title: string; description?: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onPress}
    style={({ pressed }) => ({ minHeight: t.touchTarget, padding: 12, borderRadius: t.radius.md, backgroundColor: selected || pressed ? t.colors.primaryLight : t.colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 })}>
    <View style={{ flex: 1, gap: 4 }}><Text style={textStyles.label}>{title}</Text>{description && <Text style={textStyles.body}>{description}</Text>}</View>
    {selected && <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />}
  </Pressable>;
}
