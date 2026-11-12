import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSession } from "../../providers/SessionProvider";
import { ApiError } from "../../lib/api/client";
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
  const { api, status, identity } = useSession();
  const [profile, setProfile] = useState<StudentProfile | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string>(),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setProfile(null);
      setError(undefined);
      if (
        status !== "authenticated" ||
        identity?.mustChangePassword
      ) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void api<unknown>("/academic/student/me/profile", {
        signal: controller.signal,
      })
        .then((data) => {
          if (!isStudentProfile(data))
            throw new ApiError(
              "invalid-response",
              "Hồ sơ trả về không hợp lệ.",
            );
          if (!controller.signal.aborted) setProfile(data);
        })
        .catch((e) => {
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : "Không tải được hồ sơ.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [
      api,
      status,
      identity?.accountId,
      identity?.mustChangePassword,
      revision,
    ]),
  );
  return { profile, loading, error, reload: () => setRevision((v) => v + 1) };
}
