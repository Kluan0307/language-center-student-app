import { Linking, Text } from "react-native";
import {
  Button,
  Card,
  Heading,
  Screen,
  StateView,
  textStyles,
} from "../components/ui";
import { useStudentProfile } from "../features/account/profile";
import { useSession } from "../providers/SessionProvider";
import { useState } from "react";
export default function Support() {
  const session = useSession();
  const { profile, loading, error, reload } = useStudentProfile();
  const [contactError, setContactError] = useState<string>();
  const configured = process.env.EXPO_PUBLIC_CENTER_PHONE?.trim();
  const phone = profile?.branch.phone ?? configured;
  const dial = phone?.replace(/[^+0-9]/g, "");
  return (
    <Screen>
      <Heading
        title="Hỗ trợ học viên"
        subtitle="Trung tâm hỗ trợ khôi phục tài khoản và cập nhật hồ sơ sau khi xác minh danh tính."
      />
      {loading && (
        <StateView
          loading
          title="Đang tải liên hệ"
          description="Vui lòng chờ."
        />
      )}
      {error && (
        <StateView
          title="Chưa tải được liên hệ"
          description={error}
          action={{ title: "Thử lại", onPress: reload }}
        />
      )}
      <Card>
        <Text style={textStyles.label}>
          {profile?.branch.name ?? "Liên hệ trung tâm"}
        </Text>
        {profile?.branch.address && (
          <Text style={textStyles.body}>{profile.branch.address}</Text>
        )}
        <Text style={textStyles.body}>
          {phone ??
            "Vui lòng liên hệ trực tiếp chi nhánh đang theo học hoặc kênh liên hệ chính thức của trung tâm."}
        </Text>
        {dial && (
          <Button
            title="Gọi trung tâm"
            onPress={() => {
              void Linking.openURL("tel:" + dial).catch(() =>
                setContactError("Thiết bị không thể mở ứng dụng gọi điện."),
              );
            }}
          />
        )}
        {contactError && (
          <Text accessibilityRole="alert" style={textStyles.body}>
            {contactError}
          </Text>
        )}
        <Text style={textStyles.body}>
          Khi quên mật khẩu, hãy cung cấp mã học viên và thông tin xác minh qua
          kênh chính thức. Không gửi mật khẩu hoặc mã bảo mật trong nội dung yêu
          cầu.
        </Text>
        {session.status === "authenticated" && (
          <Text style={textStyles.body}>
            Nếu hồ sơ chưa chính xác, vui lòng nêu trường cần điều chỉnh với
            nhân viên. Không tự thay đổi liên kết tài khoản.
          </Text>
        )}
      </Card>
    </Screen>
  );
}
