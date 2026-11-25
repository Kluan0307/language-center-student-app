import { useStudentQuery } from '../learning/useStudentQuery';
﻿



export interface StudentProfile {
  studentId: number;
  studentCode: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  email: string | null;
  phone: string;
  address: string | null;
  status: "STUDYING" | "PAUSED" | "GRADUATED";
  branch: { id: number; name: string; phone: string; address: string | null };
  version: number;
}
export function isStudentProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<StudentProfile>;
  return (
    Number.isSafeInteger(p.studentId) &&
    typeof p.fullName === "string" &&
    typeof p.studentCode === "string" &&
    typeof p.phone === "string" &&
    !!p.branch &&
    typeof p.branch.name === "string" &&
    typeof p.branch.phone === "string"
  );
}
export function useStudentProfile() {
  const query = useStudentQuery<unknown>('/academic/student/me/profile');
  const profile = isStudentProfile(query.data) ? query.data : null;
  return { profile, loading: query.loading, fetching: query.fetching, error: query.error ?? (query.data !== undefined && !profile ? 'Hồ sơ trả về không hợp lệ.' : undefined), reload: query.reload };
}
