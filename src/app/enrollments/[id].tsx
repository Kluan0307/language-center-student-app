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
import type { EnrollmentDetail } from "../../features/learning/types";
import { studyLabels } from "../../features/learning/types";
import {
  displayDate,
  validId,
  todayInVietnam,
} from "../../features/learning/utils";
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
  const resource = useStudentQuery<EnrollmentDetail>(
    key ? "/academic/student/me/enrollments/" + key : null,
  );
  const data = resource.data;
  return (
    <Screen>
      {!key ? (
        <StateView
          title="Đường dẫn không hợp lệ"
          description="Vui lòng chọn lại lớp học."
        />
      ) : resource.loading ? (
        <StateView
          loading
          title="Đang tải lớp học"
          description="Vui lòng chờ."
        />
      ) : resource.error ? (
        <StateView
          title="Chưa mở được lớp"
          description={resource.error}
          action={{ title: "Thử lại", onPress: resource.reload }}
        />
      ) : data ? (
        <>
          <Heading
            title={data.enrollment.className}
            subtitle={
              data.enrollment.classCode + " · " + data.enrollment.courseName
            }
          />
          <Card>
            {[
              ["Trạng thái học", studyLabels[data.enrollment.status]],
              ["Giáo viên hiện tại", data.enrollment.teacherName],
              ["Phòng của lớp", data.enrollment.roomName],
              ["Chi nhánh", data.enrollment.branch.name],
              ["Địa chỉ", data.enrollment.branch.address ?? "Chưa cập nhật"],
              [
                "Thời gian lớp",
                displayDate(data.enrollment.startDate) +
                  " – " +
                  displayDate(data.enrollment.endDate),
              ],
            ].map(([label, value]) => (
              <View key={label} style={{ gap: 4 }}>
                <Text style={textStyles.label}>{label}</Text>
                <Text style={textStyles.body}>{value}</Text>
              </View>
            ))}
            <Button
              title="Xem lịch lớp này"
              onPress={() =>
                router.navigate({
                  pathname: "/schedule",
                  params: {
                    enrollmentId: key,
                    date: todayInVietnam(),
                    view: "agenda",
                  },
                })
              }
            />
            <Button title="Học phí của đăng ký" onPress={()=>router.navigate({pathname:"/tuition",params:{enrollmentId:key!}})}/>
            <Button title="Tài liệu lớp học" onPress={()=>router.navigate({pathname:"/documents",params:{enrollmentId:key!}})}/>
            <Button title="Xem điểm & kết quả" onPress={()=>router.navigate({pathname:"/grades/[id]",params:{id:key!}})}/>
            <Button title="Xem chuyên cần" onPress={()=>router.navigate({pathname:"/attendance/[id]",params:{id:key!}})}/>
            <Text style={textStyles.body}>
              Lịch từng buổi thể hiện phòng và giáo viên thực tế, có thể khác
              thông tin chung của lớp.
            </Text>
          </Card>
          <Card>
            <Text style={textStyles.section}>Thời kỳ theo học</Text>
            {data.coverage !== "VERIFIED_PERIODS" && (
              <Text style={textStyles.body}>
                {data.coverage === "LEGACY_ESTIMATED"
                  ? "Hồ sơ cũ chưa có thời kỳ đầy đủ. Lịch được suy từ ngày đăng ký đang học và cần trung tâm xác minh."
                  : "Hồ sơ cũ thiếu thời kỳ theo học. Lịch sử chỉ hiển thị buổi có bản ghi liên kết xác thực."}
              </Text>
            )}
            {data.periods.map((p, i) => (
              <Text key={i} style={textStyles.body}>
                {displayDate(p.activeFrom)} →{" "}
                {p.activeUntil
                  ? "trước " + displayDate(p.activeUntil)
                  : "Đang có hiệu lực"}
              </Text>
            ))}
          </Card>
          <Card>
            <Text style={textStyles.section}>Lịch sử đăng ký</Text>
            {!data.publicEvents.length ? (
              <Text style={textStyles.body}>
                Chưa có sự kiện được ghi nhận.
              </Text>
            ) : (
              data.publicEvents.map((event, i) => (
                <View key={i} style={{ gap: 4 }}>
                  <Text style={textStyles.label}>
                    {displayDate(event.effectiveDate)} ·{" "}
                    {studyLabels[event.newStatus as keyof typeof studyLabels] ??
                      "Cập nhật đăng ký"}
                  </Text>
                  {event.expectedReturnDate && (
                    <Text style={textStyles.body}>
                      Dự kiến trở lại: {displayDate(event.expectedReturnDate)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </Card>
        </>
      ) : (
        <StateView
          title="Chưa có dữ liệu"
          description="Vui lòng đăng nhập hoặc chọn lại lớp học."
        />
      )}
    </Screen>
  );
}
