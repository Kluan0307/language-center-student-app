import { router } from "expo-router";
import { Screen, StateView } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <StateView
        title="Không tìm thấy trang"
        description="Nội dung có thể đã thay đổi hoặc không còn khả dụng."
        action={{ title: "Về trang chủ", onPress: () => router.replace("/") }}
      />
    </Screen>
  );
}
