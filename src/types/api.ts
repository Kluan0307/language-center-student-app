export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface StudentIdentity {
  accountId: number;
  username: string;
  role: "STUDENT";
  fullName?: string;
  mustChangePassword: boolean;
}
export function isStudentIdentity(value: unknown): value is StudentIdentity {
  if (!value || typeof value !== "object") return false;
  const x = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(x.accountId) &&
    Number(x.accountId) > 0 &&
    typeof x.username === "string" &&
    x.role === "STUDENT" &&
    typeof x.mustChangePassword === "boolean"
  );
}
// Business DTOs will be defined against implemented Student APIs, not admin responses.
