import { ApiError } from "../../lib/api/client";
import type { createApiClient } from "../../lib/api/client";
export const BUSINESS_ZONE = "Asia/Ho_Chi_Minh";
export function todayInVietnam(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export function addDays(date: string, amount: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
export function weekStart(date: string) {
  const d = new Date(date + "T00:00:00Z").getUTCDay();
  return addDays(date, -((d + 6) % 7));
}
export function displayDate(date: string) {
  return isDate(date)
    ? date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4)
    : date;
}
export function validId(value: unknown): string | null {
  return typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
    ? value
    : null;
}
export type ScheduleMode = "day" | "week" | "agenda";
export function scheduleParams(params: {
  date?: unknown;
  view?: unknown;
  enrollmentId?: unknown;
}) {
  const date = isDate(params.date) ? params.date : todayInVietnam();
  const view: ScheduleMode =
    params.view === "week" || params.view === "agenda" ? params.view : "day";
  return { date, view, enrollmentId: validId(params.enrollmentId) };
}
export function dateWindow(date: string, view: ScheduleMode) {
  const from = view === "day" ? date : weekStart(date);
  return { from, to: view === "day" ? date : addDays(from, 6) };
}
export type Api = ReturnType<typeof createApiClient>;
export async function loadAllPages(
  api: Api,
  path: string,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let total: number | undefined;
  for (let page = 0; page < 1000; page++) {
    const raw = await api<unknown>(
      path + (path.includes("?") ? "&" : "?") + "page=" + page + "&size=100",
      { signal },
    );
    if (!raw || typeof raw !== "object")
      throw new ApiError(
        "invalid-response",
        "Dữ liệu phân trang không hợp lệ.",
      );
    const p = raw as {
      content: unknown[];
      page: number;
      size: number;
      totalPages: number;
      totalElements: number;
    };
    if (
      !Array.isArray(p.content) ||
      p.page !== page ||
      p.size !== 100 ||
      !Number.isSafeInteger(p.totalElements) ||
      p.totalElements < 0 ||
      p.totalPages !== Math.ceil(p.totalElements / 100)
    )
      throw new ApiError(
        "invalid-response",
        "Dữ liệu phân trang không hợp lệ.",
      );
    if (total !== undefined && total !== p.totalElements)
      throw new ApiError(
        "http",
        "Dữ liệu vừa thay đổi. Vui lòng tải lại.",
        409,
      );
    total = p.totalElements;
    rows.push(...p.content);
    if (page + 1 >= p.totalPages) {
      if (rows.length !== total)
        throw new ApiError(
          "http",
          "Dữ liệu vừa thay đổi. Vui lòng tải lại.",
          409,
        );
      const ids = rows.map((row) =>
        row && typeof row === "object"
          ? ((row as { sessionId?: number; id?: number }).sessionId ??
            (row as { id?: number }).id)
          : undefined,
      );
      if (
        ids.every((id) => id !== undefined) &&
        new Set(ids).size !== ids.length
      )
        throw new ApiError(
          "http",
          "Dữ liệu vừa thay đổi. Vui lòng tải lại.",
          409,
        );
      return rows;
    }
  }
  throw new ApiError("http", "Dữ liệu quá lớn. Hãy thu hẹp khoảng ngày.", 400);
}
export function minuteOfDay(value: string | null) {
  if (!value || !/^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60 ? h * 60 + m : null;
}
export function safeReturnTo(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.includes("#") ||
    value.startsWith("//")
  )
    return null;
  if (/^\/(sessions|enrollments|grades|attendance|support-requests|tuitions|receipts|notifications)\/[1-9]\d*$/.test(value)) return value;
  if (
    [
      "/schedule",
      "/learning",
      "/profile",
      "/tuition",
      "/payment-orders", "/settings", "/notifications", "/documents", "/support", "/contact", "/receipts",
    ].includes(value)
  )
    return value;
  if (/^\/payment-orders\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return value;
  if (/^\/documents\?enrollmentId=[1-9]\d*$/.test(value)) return value;
  if (/^\/(tuition\?enrollmentId|receipts\?tuitionId)=[1-9]\d*$/.test(value)) return value;
  if (/^\/support\?category=PAYMENT&resourceType=(TUITION|RECEIPT)&resourceId=[1-9]\d*$/.test(value)) return value;
  if (value.startsWith("/schedule?")) {
    const params = new URLSearchParams(value.slice(value.indexOf("?") + 1));
    const state = scheduleParams({
      date: params.get("date"),
      view: params.get("view"),
      enrollmentId: params.get("enrollmentId"),
    });
    return (
      "/schedule?" +
      new URLSearchParams({
        date: state.date,
        view: state.view,
        ...(state.enrollmentId ? { enrollmentId: state.enrollmentId } : {}),
      }).toString()
    );
  }
  return null;
}
export function layoutDay<
  T extends {
    sessionId: number;
    startTime: string | null;
    endTime: string | null;
  },
>(sessions: T[]) {
  const sorted = sessions
    .map((s) => ({
      session: s,
      start: minuteOfDay(s.startTime),
      end: minuteOfDay(s.endTime),
    }))
    .filter(
      (x): x is { session: T; start: number; end: number } =>
        x.start !== null && x.end !== null && x.end > x.start,
    )
    .sort(
      (a, b) =>
        a.start - b.start ||
        a.end - b.end ||
        a.session.sessionId - b.session.sessionId,
    );
  const groups: (typeof sorted)[] = [];
  let end = -1;
  for (const event of sorted) {
    if (!groups.length || event.start >= end) {
      groups.push([]);
      end = event.end;
    } else end = Math.max(end, event.end);
    groups[groups.length - 1].push(event);
  }
  return groups.flatMap((group) => {
    const ends: number[] = [];
    const placed = group.map((e) => {
      let lane = ends.findIndex((end) => end <= e.start);
      if (lane < 0) lane = ends.length;
      ends[lane] = e.end;
      return { ...e, lane };
    });
    return placed.map((e) => ({ ...e, lanes: ends.length }));
  });
}
