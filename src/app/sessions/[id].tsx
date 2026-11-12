import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { SessionGate } from "../../components/SessionGate";
import {
  Button,
  Card,
  Heading,
  Screen,
  StateView,
  textStyles,
} from "../../components/ui";
import { useStudentQuery } from "../../features/learning/useStudentQuery";
import type { Session } from "../../features/learning/types";
import { sessionLabels } from "../../features/learning/types";
import { validId, displayDate } from "../../features/learning/utils";
export default function Detail() {
  return (
    <SessionGate>
      <Content />
    </SessionGate>
  );
}
function Content() {
  const { id } = useLocalSearchParams();
  const key = validId(id);
  const resource = useStudentQuery<Session>(
    key ? "/academic/student/me/sessions/" + key : null,
  );
  const data = resource.data;
  return (
    <Screen>
      {!key ? (
        <StateView
          title="Đường dẫn không hợp lệ"
          description="Vui lòng chọn lại buổi học."
        />
      ) : resource.loading ? (
        <StateView
          loading
          title="Đang tải buổi học"
          description="Vui lòng chờ."
        />
      ) : resource.error ? (
        <StateView
          title="Chưa mở được buổi học"
          description={resource.error}
          action={{ title: "Thử lại", onPress: resource.reload }}
        />
      ) : data ? (
        <>
          <Heading
            title={data.className}
            subtitle={
              displayDate(data.date) + " · " + sessionLabels[data.status]
            }
          />
          <Card>
            {[
              [
                "Thời gian",
                data.startTime && data.endTime
                  ? data.startTime.slice(0, 5) +
                    " – " +
                    data.endTime.slice(0, 5) +
                    " (GMT+7)"
                  : "Chưa xác định giờ",
              ],
              [
                "Buổi học",
                data.isMakeup
                  ? "Học bù"
                  : data.kind === "LEGACY"
                    ? "Buổi lịch sử"
                    : "Thông thường",
              ],
              ["Giáo viên", data.teacherName ?? "Chưa phân công"],
              ["Phòng", data.roomName ?? "Chưa cập nhật"],
              ["Chi nhánh", data.branch.name],
              ["Địa chỉ", data.branch.address ?? "Chưa cập nhật"],
            ].map(([label, value]) => (
              <View key={label} style={{ gap: 4 }}>
                <Text style={textStyles.label}>{label}</Text>
                <Text style={textStyles.body}>{value}</Text>
              </View>
            ))}
            {data.teacherChanged && (
              <Text style={textStyles.body}>
                Giáo viên thực tế khác phân công ban đầu.
              </Text>
            )}
            {data.status === "CANCELLED" && (
              <Text style={textStyles.body}>
                Buổi đã hủy. Vui lòng kiểm tra buổi học bù trên lịch hoặc liên
                hệ trung tâm.
              </Text>
            )}
            {data.legacyEstimated && (
              <Text style={textStyles.body}>
                Lịch dựa trên đăng ký cũ, chưa xác minh đủ thời kỳ.
              </Text>
            )}
            <Button
              title="Xem lớp học"
              onPress={() => router.push("/enrollments/" + data.enrollmentId)}
            />
            <Button
              title="Tải lại buổi học"
              secondary
              onPress={resource.reload}
            />
          </Card>
        </>
      ) : (
        <StateView
          title="Chưa có dữ liệu"
          description="Vui lòng chọn lại buổi học."
        />
      )}
    </Screen>
  );
}
