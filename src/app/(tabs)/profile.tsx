import { router } from "expo-router";
import {
  Card,
  Heading,
  Row,
  Screen,
  Button,
  StateView,
} from "../../components/ui";
import { useSession } from "../../providers/SessionProvider";
export default function Profile() {
  const session = useSession();
  return (
    <Screen>
      <Heading
        title="Cá nhân"
        subtitle="Thông tin và thiết lập dành cho bạn."
      />
      <Card>
        <StateView
          title="Hồ sơ học viên"
          description="Hồ sơ sẽ xuất hiện sau khi tài khoản được liên kết với trung tâm."
          icon="person-circle-outline"
        />
      </Card>
      <Card>
        <Row
          title="Cài đặt"
          description="Thiết lập ứng dụng và thông báo"
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
        <Row
          title="Hỗ trợ"
          description="Liên hệ và gửi yêu cầu đến trung tâm"
          icon="help-circle-outline"
          onPress={() => router.push("/support")}
        />
      </Card>
      {session.preview && (
        <Button
          title="Thoát xem trước"
          secondary
          onPress={() => {
            session.endPreview();
            router.replace("/welcome");
          }}
        />
      )}
    </Screen>
  );
}
