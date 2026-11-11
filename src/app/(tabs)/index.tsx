import { router } from "expo-router";
import {
  Card,
  Heading,
  Row,
  Screen,
  StateView,
  textStyles,
} from "../../components/ui";
import { Text } from "react-native";
export default function Home() {
  return (
    <Screen>
      <Heading
        title="Chào bạn!"
        subtitle="Một nơi để theo dõi hành trình học tập của bạn."
      />
      <Card>
        <StateView
          title="Sẵn sàng cho buổi học tiếp theo"
          description="Lịch cá nhân sẽ được cập nhật khi tài khoản học viên được kích hoạt."
          icon="calendar-outline"
        />
      </Card>
      <Card>
        <Text style={textStyles.section}>Truy cập nhanh</Text>
        <Row
          title="Lịch học của tôi"
          description="Thời gian, phòng học và giáo viên"
          icon="calendar-outline"
          onPress={() => router.navigate("/schedule")}
        />
        <Row
          title="Kết quả học tập"
          description="Điểm số, chuyên cần và tài liệu"
          icon="school-outline"
          onPress={() => router.navigate("/learning")}
        />
        <Row
          title="Học phí và phiếu thu"
          description="Theo dõi các khoản thanh toán"
          icon="receipt-outline"
          onPress={() => router.navigate("/tuition")}
        />
      </Card>
    </Screen>
  );
}
