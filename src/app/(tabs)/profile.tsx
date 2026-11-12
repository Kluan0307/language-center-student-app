import { router } from "expo-router";
import { Alert, Text, View } from "react-native";
import {
  Card,
  Heading,
  Row,
  Screen,
  Button,
  StateView,
  textStyles,
} from "../../components/ui";
import { useSession } from "../../providers/SessionProvider";
import { useStudentProfile } from "../../features/account/profile";
import { useState } from "react";
export default function Profile() {
  const session = useSession();
  const resource = useStudentProfile();
  const [busy, setBusy] = useState(false);
  const p = resource.profile;
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const confirmed = await session.logoutAll();
      router.replace("/welcome");
      if (!confirmed)
        Alert.alert(
          "Đã thoát trên thiết bị này",
          "Chưa xác nhận được việc thu hồi phiên trên máy chủ. Liên hệ trung tâm nếu cần khóa tài khoản.",
        );
    } catch {
      Alert.alert("Chưa xóa được phiên", "Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    STUDYING: "Đang học",
    PAUSED: "Tạm ngừng",
    GRADUATED: "Đã hoàn thành",
  };
  return (
    <Screen>
      <Heading
        title="Cá nhân"
        subtitle="Thông tin và thiết lập dành cho bạn."
      />
      <Card>
        {resource.loading ? (
          <StateView
            loading
            title="Đang tải hồ sơ"
            description="Vui lòng chờ."
          />
        ) : resource.error ? (
          <StateView
            title="Chưa tải được hồ sơ"
            description={resource.error}
            action={{ title: "Thử lại", onPress: resource.reload }}
          />
        ) : p ? (
          <>
            <Text style={textStyles.section}>{p.fullName}</Text>
            {[
              ["Mã học viên", p.studentCode],
              ["Ngày sinh", p.dateOfBirth],
              [
                "Giới tính",
                p.gender === "MALE"
                  ? "Nam"
                  : p.gender === "FEMALE"
                    ? "Nữ"
                    : p.gender === "OTHER"
                      ? "Khác"
                      : null,
              ],
              ["Điện thoại", p.phone],
              ["Email", p.email],
              ["Địa chỉ", p.address],
              ["Trạng thái", labels[p.status] ?? p.status],
              ["Chi nhánh", p.branch.name],
            ].map(([label, value]) => (
              <View key={label} style={{ gap: 4 }}>
                <Text style={textStyles.label}>{label}</Text>
                <Text style={textStyles.body}>{value || "Chưa cập nhật"}</Text>
              </View>
            ))}
          </>
        ) : (
          <StateView
            title="Chưa có hồ sơ"
            description="Vui lòng liên hệ trung tâm để kiểm tra liên kết tài khoản."
          />
        )}
      </Card>
      <Card>
        {(
          <Row
            title="Đổi mật khẩu"
            description="Bảo vệ tài khoản của bạn"
            icon="lock-closed-outline"
            onPress={() => router.push("/change-password")}
          />
        )}
        <Row
          title="Cập nhật thông tin / Hỗ trợ"
          description="Liên hệ chi nhánh để xác minh và điều chỉnh"
          icon="help-circle-outline"
          onPress={() => router.push("/support")}
        />
        <Row
          title="Cài đặt"
          description="Thiết lập ứng dụng và thông báo"
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
      </Card>
      {(        <Button
          title={busy ? "Đang đăng xuất…" : "Đăng xuất tất cả thiết bị"}
          secondary
          disabled={busy}
          onPress={() => {
            void logout();
          }}
        />
      )}
    </Screen>
  );
}
