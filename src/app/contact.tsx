import { Linking, Text } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Heading, InlineNotice, Row, Screen, StateView, textStyles } from '../components/ui';
import { useStudentProfile } from '../features/account/profile';
import { useSession } from '../providers/SessionProvider';

export default function Contact() {
  const session = useSession(), query = useStudentProfile(), [error, setError] = useState<string>();
  const phone = query.profile?.branch.phone || process.env.EXPO_PUBLIC_CENTER_PHONE?.trim(), dial = phone?.replace(/[^+0-9]/g, '');
  return <Screen onRefresh={session.status === 'authenticated' ? query.reload : undefined} refreshing={query.loading}>
    <Heading title="Liên hệ trung tâm" subtitle="Chi nhánh hỗ trợ việc học và tài khoản của bạn." />
    {query.loading && <StateView loading title="Đang tải liên hệ" description="Vui lòng chờ." />}
    {query.error && <InlineNotice title="Chưa tải được liên hệ chi nhánh" action={{ title: 'Thử lại', onPress: query.reload }} />}
    <Card><Text style={textStyles.section}>{query.profile?.branch.name ?? 'Trung tâm ngoại ngữ'}</Text>
      {query.profile?.branch.address && <Text style={textStyles.body}>{query.profile.branch.address}</Text>}
      <Text style={textStyles.label}>{phone || 'Liên hệ qua kênh chính thức của trung tâm.'}</Text>
      {dial && <Button title="Gọi chi nhánh" onPress={() => { void Linking.openURL('tel:' + dial).catch(() => setError('Thiết bị chưa mở được ứng dụng gọi điện. Bạn có thể gọi trực tiếp số ở trên.')); }} />}
      {error && <InlineNotice title="Chưa thực hiện được cuộc gọi" description={error} />}
    </Card>
    {session.status === 'authenticated' && <Card><Row title="Gửi yêu cầu hỗ trợ" description="Theo dõi câu trả lời ngay trong ứng dụng" icon="chatbubbles-outline" onPress={() => router.push('/support')} /></Card>}
    <Card><Text style={textStyles.label}>Khi quên mật khẩu</Text><Text style={textStyles.body}>Cung cấp mã học viên và thông tin xác minh qua kênh chính thức của trung tâm để được hỗ trợ khôi phục tài khoản.</Text></Card>
  </Screen>;
}
