import { useLocalSearchParams, router } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  StateView,
  textStyles,
} from "../../components/ui";
import { useStudentQuery } from "../../features/learning/useStudentQuery";
import type { Enrollment } from "../../features/learning/types";
import { studyLabels } from "../../features/learning/types";
import { displayDate } from "../../features/learning/utils";
import type { PageResponse } from "../../types/api";
export default function Learning() {
  const params = useLocalSearchParams();
  const group = params.group === "HISTORY" ? "HISTORY" : "CURRENT";
  const raw = Number(params.page ?? 0);
  const page = Number.isSafeInteger(raw) && raw >= 0 && raw < 100000 ? raw : 0;
  const resource = useStudentQuery<PageResponse<Enrollment>>(
    "/academic/student/me/enrollments?group=" +
      group +
      "&page=" +
      page +
      "&size=20",
  );
  return (
    <Screen>
      <Heading
        title="Lớp học của tôi"
        subtitle="Theo dõi lớp hiện tại và quá trình học trước đây."
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(
          [
            ["CURRENT", "Đang học / Bảo lưu"],
            ["HISTORY", "Lịch sử"],
          ] as const
        ).map(([value, title]) => (
          <View key={value} style={{ flex: 1 }}>
            <Button
              title={title}
              secondary={group !== value}
              onPress={() => router.setParams({ group: value, page: "0" })}
            />
          </View>
        ))}
      </View>
      {!resource.enabled ? (
        <Card>
          <StateView
            title="Đăng nhập để xem lớp học"
            description="Chỉ hiển thị các đăng ký thuộc hồ sơ của bạn."
          />
        </Card>
      ) : resource.loading ? (
        <StateView loading title="Đang tải lớp" description="Vui lòng chờ." />
      ) : resource.error ? (
        <StateView
          title="Chưa tải được lớp"
          description={resource.error}
          action={{ title: "Thử lại", onPress: resource.reload }}
        />
      ) : !resource.data?.content.length ? (
        <Card>
          <StateView
            title="Chưa có lớp trong mục này"
            description="Bạn có thể đổi nhóm hoặc liên hệ trung tâm nếu cần kiểm tra đăng ký."
            icon="book-outline"
          />
        </Card>
      ) : (
        <>
          {resource.data.content.map((e) => (
            <Card key={e.id}>
              <Row
                title={e.className}
                description={e.classCode + " · " + e.courseName}
                icon="school-outline"
                onPress={() => router.push("/enrollments/" + e.id)}
              />
              <Text style={textStyles.body}>
                {studyLabels[e.status]} · {e.branch.name}
              </Text>
              <Text style={textStyles.body}>
                {displayDate(e.startDate)} – {displayDate(e.endDate)}
              </Text>
              <Text style={textStyles.body}>Giáo viên: {e.teacherName}</Text>
            </Card>
          ))}
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Button
              title="Trước"
              secondary
              disabled={page === 0}
              onPress={() => router.setParams({ page: String(page - 1) })}
            />
            <Text style={[textStyles.body, { flex: 1, textAlign: "center" }]}>
              {page + 1}/{resource.data.totalPages}
            </Text>
            <Button
              title="Sau"
              secondary
              disabled={page + 1 >= resource.data.totalPages}
              onPress={() => router.setParams({ page: String(page + 1) })}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
