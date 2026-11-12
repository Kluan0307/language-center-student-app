import type { ScrollViewInstance } from "react-native";
import { useRef } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Card, textStyles } from "../../components/ui";
import { theme as t } from "../../theme/tokens";
import type { Session } from "./types";
import { sessionLabels } from "./types";
import { addDays, displayDate, layoutDay, minuteOfDay } from "./utils";
export function SessionCard({ session: s }: { session: Session }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Xem buổi " + s.className + " " + s.date}
      onPress={() => router.push("/sessions/" + s.sessionId)}
    >
      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Text style={textStyles.label}>
            {s.startTime?.slice(0, 5) ?? "Chưa rõ giờ"}
            {s.endTime ? " – " + s.endTime.slice(0, 5) : ""}
          </Text>
          <Text
            style={{
              color:
                s.status === "CANCELLED"
                  ? t.colors.muted
                  : s.status === "COMPLETED"
                    ? t.colors.success
                    : t.colors.primary,
            }}
          >
            {sessionLabels[s.status]}
          </Text>
        </View>
        <Text style={textStyles.label}>{s.className}</Text>
        <Text style={textStyles.body}>
          {displayDate(s.date)} · {s.branch.name}
        </Text>
        <Text style={textStyles.body}>
          {s.roomName ?? "Chưa cập nhật phòng"} ·{" "}
          {s.teacherName ?? "Chưa phân công giáo viên"}
        </Text>
        {(s.isMakeup || s.teacherChanged) && (
          <Text style={{ color: t.colors.primary }}>
            {[
              s.isMakeup ? "Học bù" : null,
              s.teacherChanged ? "Đổi giáo viên" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}
        {s.legacyEstimated && (
          <Text style={textStyles.body}>
            Lịch dựa trên đăng ký cũ; trung tâm cần xác minh thời kỳ học.
          </Text>
        )}
      </Card>
    </Pressable>
  );
}
export function WeekGrid({
  from,
  sessions,
  focusDate = from,
}: {
  from: string;
  sessions: Session[];
  focusDate?: string;
}) {
  const scroll = useRef<ScrollViewInstance>(null);
  const valid = sessions.filter((s) => {
    const start = minuteOfDay(s.startTime),
      end = minuteOfDay(s.endTime);
    return start !== null && end !== null && end > start;
  });
  if (!valid.length)
    return (
      <View style={{ gap: 12 }}>
        <Text style={textStyles.body}>
          Chưa đủ giờ học để hiển thị trên lưới. Các buổi hiện có được liệt kê
          bên dưới.
        </Text>
        {sessions.map((session) => (
          <SessionCard key={session.sessionId} session={session} />
        ))}
      </View>
    );
  const times = valid.flatMap((s) => [
    minuteOfDay(s.startTime)!,
    minuteOfDay(s.endTime)!,
  ]);
  const startHour = times.length
      ? Math.max(0, Math.min(...times.map((v) => Math.floor(v / 60))) - 1)
      : 7,
    endHour = times.length
      ? Math.min(24, Math.max(...times.map((v) => Math.ceil(v / 60))) + 1)
      : 21;
  const rowHeight = 64,
    dayWidth = 142,
    height = (endHour - startHour) * rowHeight;
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const focus = () =>
    scroll.current?.scrollTo({
      x: Math.max(0, days.indexOf(focusDate)) * dayWidth,
      animated: false,
    });
  return (
    <View style={{ gap: 12 }}>
      <Text style={textStyles.body}>
        Vuốt ngang để xem cả tuần. Giờ Việt Nam (GMT+7).
      </Text>
      <View style={{ flexDirection: "row", height: height + 48 }}>
        <View style={{ width: 48, height: height + 48 }}>
          <Text style={{ color: t.colors.muted, fontSize: 12 }}>Giờ</Text>
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <Text
              key={i}
              style={{
                position: "absolute",
                top: 48 + i * rowHeight,
                color: t.colors.muted,
                fontSize: 12,
              }}
            >
              {String(startHour + i).padStart(2, "0")}:00
            </Text>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          horizontal
          showsHorizontalScrollIndicator
          nestedScrollEnabled
          onLayout={focus}
          onContentSizeChange={focus}
        >
          <View>
            <View style={{ flexDirection: "row", height: 48 }}>
              {days.map((day, i) => (
                <View
                  key={day}
                  style={{
                    width: dayWidth,
                    alignItems: "center",
                    backgroundColor:
                      day === focusDate ? t.colors.primaryLight : undefined,
                  }}
                >
                  <Text style={{ color: t.colors.text, fontWeight: "600" }}>
                    {i === 6 ? "CN" : "T" + (i + 2)}
                  </Text>
                  <Text style={{ color: t.colors.muted }}>
                    {displayDate(day).slice(0, 5)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row" }}>
              {days.map((day) => (
                <View
                  key={day}
                  style={{
                    width: dayWidth,
                    height,
                    borderLeftWidth: 1,
                    borderColor: t.colors.border,
                    backgroundColor: t.colors.surface,
                  }}
                >
                  {Array.from({ length: endHour - startHour }, (_, i) => (
                    <View
                      key={i}
                      style={{
                        position: "absolute",
                        top: i * rowHeight,
                        left: 0,
                        right: 0,
                        borderTopWidth: 1,
                        borderColor: t.colors.border,
                      }}
                    />
                  ))}
                  {layoutDay(valid.filter((s) => s.date === day)).map((e) => (
                    <Pressable
                      key={e.session.sessionId}
                      accessibilityRole="button"
                      accessibilityLabel={
                        "Buổi " +
                        e.session.className +
                        " " +
                        day +
                        " " +
                        e.session.startTime
                      }
                      onPress={() =>
                        router.push("/sessions/" + e.session.sessionId)
                      }
                      style={[
                        styles.event,
                        {
                          top: ((e.start - startHour * 60) * rowHeight) / 60,
                          height: Math.max(
                            18,
                            ((e.end - e.start) * rowHeight) / 60 - 2,
                          ),
                          left: (e.lane * dayWidth) / e.lanes + 3,
                          width: dayWidth / e.lanes - 6,
                          backgroundColor:
                            e.session.status === "CANCELLED"
                              ? t.colors.border
                              : e.session.status === "COMPLETED"
                                ? "#DCFCE7"
                                : t.colors.primaryLight,
                        },
                      ]}
                    >
                      <Text numberOfLines={1} style={styles.eventTime}>
                        {e.session.startTime?.slice(0, 5)}–
                        {e.session.endTime?.slice(0, 5)}
                      </Text>
                      <Text numberOfLines={2} style={styles.eventTitle}>
                        {e.session.className}
                      </Text>
                      <Text numberOfLines={1} style={styles.eventTime}>
                        {sessionLabels[e.session.status]}
                        {e.session.isMakeup ? " · Bù" : ""}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      {sessions
        .filter((s) => !valid.includes(s))
        .map((s) => (
          <SessionCard key={s.sessionId} session={s} />
        ))}
    </View>
  );
}
const styles = StyleSheet.create({
  event: {
    position: "absolute",
    borderRadius: 8,
    padding: 5,
    overflow: "hidden",
    borderLeftWidth: 3,
    borderLeftColor: t.colors.primary,
  },
  eventTime: { fontSize: 11, color: t.colors.text },
  eventTitle: { fontSize: 12, fontWeight: "600", color: t.colors.text },
});
