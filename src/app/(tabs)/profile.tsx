import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { useState } from 'react';
import { Card, Row, Screen, Button, StateView, textStyles } from '../../components/ui';
import { Badge, Disclosure, Fact } from '../../components/Details';
import { BottomSheet } from '../../components/BottomSheet';
import { useSession } from '../../providers/SessionProvider';
import { useStudentProfile } from '../../features/account/profile';
import { supportLink } from '../../features/support/context';
import { displayDate } from '../../features/learning/utils';
export default function Profile() {
  const session = useSession(), query = useStudentProfile(), profile = query.profile;
  const [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false);
  async function logout() {
    if (busy) return; setBusy(true);
    try { const confirmed = await session.logoutAll(); setConfirm(false); router.replace('/welcome'); if (!confirmed) Alert.alert('Đã thoát trên thiết bị này', 'Chưa xác nhận được việc thu hồi phiên trên máy chủ. Liên hệ trung tâm nếu cần khóa tài khoản.'); }
    catch { Alert.alert('Chưa xóa được phiên', 'Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  const labels = { STUDYING: 'Đang học', PAUSED: 'Tạm ngừng', GRADUATED: 'Đã hoàn thành' };
  return <Screen onRefresh={query.reload} refreshing={query.loading}>
    <Card>{query.loading ? <StateView loading title="Đang tải hồ sơ" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa tải được hồ sơ" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : profile ? <><Text style={[textStyles.section, { fontSize: 24, lineHeight: 32 }]}>{profile.fullName}</Text><Text style={textStyles.body}>{profile.studentCode} · {profile.branch.name}</Text><Badge label={labels[profile.status] ?? profile.status} /></>
      : <StateView title="Chưa có hồ sơ" description="Liên hệ trung tâm để kiểm tra tài khoản." />}</Card>
    <Card><Row title="Hỗ trợ và yêu cầu" description="Gửi vấn đề, theo dõi phản hồi của trung tâm" icon="chatbubbles-outline" onPress={() => router.push('/support')} />
      <Row title="Liên hệ chi nhánh" description="Điện thoại và thông tin trung tâm" icon="call-outline" onPress={() => router.push('/contact')} /></Card>
    <Card><Row title="Cài đặt thông báo" description="Chọn những cập nhật bạn muốn nhận" icon="notifications-outline" onPress={() => router.push('/settings')} />
      <Row title="Đổi mật khẩu" description="Bảo vệ tài khoản của bạn" icon="lock-closed-outline" onPress={() => router.push('/change-password')} /></Card>
    {profile && <Disclosure title="Thông tin cá nhân">
      <Fact label="Ngày sinh" value={profile.dateOfBirth ? displayDate(profile.dateOfBirth) : null} />
      <Fact label="Giới tính" value={profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : profile.gender === 'OTHER' ? 'Khác' : null} />
      <Fact label="Điện thoại" value={profile.phone} /><Fact label="Email" value={profile.email} /><Fact label="Địa chỉ" value={profile.address} />
      <Button secondary title="Yêu cầu cập nhật thông tin" onPress={() => router.push(supportLink('PROFILE', 'PROFILE', String(profile.studentId)))} />
    </Disclosure>}
    <Button secondary title="Đăng xuất" disabled={busy} onPress={() => setConfirm(true)} />
    <BottomSheet visible={confirm} title="Đăng xuất tài khoản?" onClose={() => { if (!busy) setConfirm(false); }}>
      <Text style={textStyles.body}>Thao tác này kết thúc phiên đăng nhập trên tất cả thiết bị của tài khoản.</Text>
      <Button title={busy ? 'Đang đăng xuất…' : 'Đăng xuất tất cả thiết bị'} disabled={busy} onPress={() => void logout()} />
    </BottomSheet>
  </Screen>;
}
