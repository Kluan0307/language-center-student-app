export interface Branch {
  id: number;
  name: string;
  phone: string;
  address: string | null;
}
export interface Enrollment {
  id: number;
  classId: number;
  classCode: string;
  className: string;
  courseName: string;
  teacherName: string;
  roomName: string;
  branch: Branch;
  status: "STUDYING" | "RESERVED" | "TRANSFERRED" | "DROPPED" | "COMPLETED";
  classStatus: string;
  startDate: string;
  endDate: string;
  enrolledAt: string;
}
export interface EnrollmentDetail {
  enrollment: Enrollment;
  periods: { activeFrom: string; activeUntil: string | null }[];
  coverage: string;
  publicEvents: {
    action: string;
    oldStatus: string | null;
    newStatus: string;
    effectiveDate: string;
    expectedReturnDate: string | null;
  }[];
}
export interface Session {
  sessionId: number;
  enrollmentId: number;
  enrollmentIds: number[];
  classId: number;
  classCode: string;
  className: string;
  courseName: string;
  branch: Branch;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  kind: string;
  isMakeup: boolean;
  teacherChanged: boolean;
  teacherName: string | null;
  roomName: string | null;
  legacyEstimated: boolean;
  version: number;
  updatedAt: string | null;
}
export interface NextSession {
  session: Session | null;
  asOf: string;
  timezone: string;
}
export const studyLabels: Record<Enrollment["status"], string> = {
  STUDYING: "Đang học",
  RESERVED: "Bảo lưu",
  TRANSFERRED: "Đã chuyển lớp",
  DROPPED: "Đã ngừng học",
  COMPLETED: "Đã kết thúc đăng ký",
};
export const sessionLabels: Record<Session["status"], string> = {
  SCHEDULED: "Theo lịch",
  COMPLETED: "Đã diễn ra",
  CANCELLED: "Đã hủy",
};

