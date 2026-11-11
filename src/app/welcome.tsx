import { Redirect, router } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Card,
  Heading,
  Screen,
  StateView,
  textStyles,
} from "../components/ui";
import { useSession } from "../providers/SessionProvider";
import { theme } from "../theme/tokens";
export default function Welcome() {
  const session = useSession();
  if (session.status === "loading" || session.status === "error")
    return (
      <Screen>
        <StateView
          title={
            session.status === "loading"
              ? "Đang mở ứng dụng"
              : "Chưa thể mở phiên"
          }
          description={session.message ?? "Vui lòng chờ trong giây lát."}
          loading={session.status === "loading"}
          action={
            session.status === "error"
              ? { title: "Thử lại", onPress: session.retry }
              : undefined
          }
        />
      </Screen>
    );
  if (session.status === "authenticated" || session.preview)
    return <Redirect href="/" />;
  return (
    <Screen>
      <View style={{ paddingTop: 32, gap: 24 }}>
        <Ionicons
          name="school-outline"
          size={56}
          color={theme.colors.primary}
        />
        <Heading
          title="Việc học của bạn, trong tầm tay"
          subtitle="Lịch học, kết quả và học phí — cùng bạn trên hành trình học tiếng Anh."
        />
        <Card>
          <Text style={textStyles.label}>Chào mừng đến Language Center</Text>
          <Text style={textStyles.body}>
            Dịch vụ tài khoản học viên chưa được mở. Trung tâm sẽ cung cấp thông
            tin kích hoạt khi sẵn sàng.
          </Text>
          <Button
            title="Liên hệ và hỗ trợ"
            secondary
            onPress={() => router.push("/support")}
          />
        </Card>
        {__DEV__ && (
          <Card>
            <Text style={textStyles.label}>
              Xem trước giao diện • Phát triển
            </Text>
            <Text style={textStyles.body}>
              Chỉ xem bố cục, không đăng nhập và không có dữ liệu học viên. Chế
              độ này không có trong bản production.
            </Text>
            <Button title="Khám phá giao diện" onPress={session.startPreview} />
          </Card>
        )}
      </View>
    </Screen>
  );
}
