import { useLocalSearchParams, router } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import {
  Button,
  Card,
  Heading,
  Screen,
  StateView,
  textStyles,
} from "../../components/ui";
import { useSession } from "../../providers/SessionProvider";
import { useStudentQuery } from "../../features/learning/useStudentQuery";
import {
  addDays,
  dateWindow,
  displayDate,
  scheduleParams,
  todayInVietnam,
} from "../../features/learning/utils";
import type { Enrollment, Session } from "../../features/learning/types";
import { SessionCard, WeekGrid } from "../../features/learning/components";
import { theme as t } from "../../theme/tokens";
export default function Schedule() {
  const session = useSession();
  const params = useLocalSearchParams();
  const state = scheduleParams(params);
  const window = dateWindow(state.date, state.view);
  const [filter, setFilter] = useState(false);
  const classes = useStudentQuery<Enrollment[]>(
    "/academic/student/me/enrollments?group=ALL",
    true,
  );
  const resource = useStudentQuery<Session[]>(
    "/academic/student/me/schedule?from=" +
      window.from +
      "&to=" +
      window.to +
      (state.enrollmentId ? "&enrollmentId=" + state.enrollmentId : ""),
    true,
  );
  const selected = classes.data?.find(
    (e) => String(e.id) === state.enrollmentId,
  );
  const update = (values: Record<string, string>) => router.setParams(values);
  const step = state.view === "day" ? 1 : 7;
  return (
    <Screen>
      <Heading
        title="Lịch học"
        subtitle="Lịch cá nhân theo giờ Việt Nam (GMT+7)."
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(
          [
            ["day", "Ngày"],
            ["agenda", "Danh sách"],
            ["week", "Lưới tuần"],
          ] as const
        ).map(([value, label]) => (
          <View key={value} style={{ flex: 1 }}>
            <Button
              title={label}
              secondary={state.view !== value}
              onPress={() => update({ view: value })}
            />
          </View>
        ))}
      </View>
      <Card>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Button
            title="‹"
            secondary
            onPress={() => update({ date: addDays(state.date, -step) })}
          />
          <Text style={[textStyles.label, { flex: 1, textAlign: "center" }]}>
            {displayDate(window.from)}
            {window.to !== window.from ? " – " + displayDate(window.to) : ""}
          </Text>
          <Button
            title="›"
            secondary
            onPress={() => update({ date: addDays(state.date, step) })}
          />
        </View>
        <Button
          title="Hôm nay"
          secondary
          onPress={() => update({ date: todayInVietnam() })}
        />
        <Button
          title={
            selected
              ? selected.className + " · " + selected.classCode
              : "Lọc lớp học"
          }
          secondary
          onPress={() => setFilter(true)}
        />
      </Card>
      {!resource.enabled ? (
        <Card>
          <StateView
            title="Đăng nhập để xem lịch"
            description="Lịch học cá nhân chỉ hiển thị với tài khoản học viên."
          />
        </Card>
      ) : resource.loading ? (
        <StateView
          loading
          title="Đang tải lịch học"
          description="Vui lòng chờ."
        />
      ) : resource.error ? (
        <Card>
          <StateView
            title="Chưa tải được lịch"
            description={resource.error}
            action={{ title: "Thử lại", onPress: resource.reload }}
          />
          {state.enrollmentId && (
            <Button
              title="Bỏ bộ lọc lớp"
              secondary
              onPress={() => update({ enrollmentId: "" })}
            />
          )}
        </Card>
      ) : (
        <>
          <Button title="Tải lại lịch" secondary onPress={resource.reload} />
          {!resource.data?.length ? (
            <Card>
              <StateView
                title="Không có buổi học trong khoảng này"
                description="Bạn có thể chọn ngày khác hoặc bỏ bộ lọc lớp."
                icon="calendar-outline"
              />
            </Card>
          ) : state.view === "week" ? (
            <WeekGrid
              from={window.from}
              sessions={resource.data}
              focusDate={state.date}
            />
          ) : (
            resource.data.map((s) => (
              <SessionCard key={s.sessionId} session={s} />
            ))
          )}
        </>
      )}
      <Modal
        visible={filter}
        transparent
        animationType="slide"
        onRequestClose={() => setFilter(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(15,23,42,.35)",
          }}
        >
          <View
            style={{
              maxHeight: "75%",
              padding: 24,
              paddingBottom: 36,
              gap: 16,
              backgroundColor: t.colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <Text style={textStyles.section}>Chọn lớp học</Text>
            <ScrollView>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  update({ enrollmentId: "" });
                  setFilter(false);
                }}
                style={{ paddingVertical: 16 }}
              >
                <Text style={textStyles.label}>Tất cả lớp của tôi</Text>
              </Pressable>
              {classes.loading && (
                <Text style={textStyles.body}>Đang tải lớp…</Text>
              )}
              {classes.error && (
                <StateView
                  title="Chưa tải được lớp"
                  description={classes.error}
                  action={{ title: "Thử lại", onPress: classes.reload }}
                />
              )}
              {classes.data?.map((e) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  onPress={() => {
                    update({ enrollmentId: String(e.id) });
                    setFilter(false);
                  }}
                  style={{
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderColor: t.colors.border,
                  }}
                >
                  <Text style={textStyles.label}>{e.className}</Text>
                  <Text style={textStyles.body}>
                    {e.classCode} · {e.branch.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Đóng" secondary onPress={() => setFilter(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
