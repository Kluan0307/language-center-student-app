import { apiBaseUrl } from "../../config/env";
export type ApiErrorKind =
  | "configuration"
  | "network"
  | "timeout"
  | "cancelled"
  | "http"
  | "invalid-response";
export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
    public code?: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
};
type Dependencies = {
  baseUrl: string | null;
  token: () => string | null;
  onUnauthorized: (token: string) => void;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};
export function createApiClient(deps: Dependencies) {
  return async function request<T>(
    path: string,
    options: Options = {},
  ): Promise<T> {
    if (!deps.baseUrl)
      throw new ApiError("configuration", "Chưa thiết lập địa chỉ máy chủ.");
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("://") ||
      /[\\#]/.test(path) ||
      path
        .split(/[/?]/)
        .some((p) => ["..", "."].includes(p) || /%2e|%2f|%5c/i.test(p))
    )
      throw new ApiError("configuration", "Đường dẫn API không hợp lệ.");
    const token = options.authenticated === false ? null : deps.token();
    if (options.authenticated !== false && !token)
      throw new ApiError("http", "Vui lòng đăng nhập.", 401);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, deps.timeoutMs ?? 15000);
    try {
      const response = await (deps.fetcher ?? fetch)(deps.baseUrl + path, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        redirect: "error",
      });
      if (response.status === 401 && token) deps.onUnauthorized(token);
      const text = response.status === 204 ? "" : await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        if (response.ok)
          throw new ApiError(
            "invalid-response",
            "Máy chủ trả dữ liệu không hợp lệ.",
          );
      }
      if (!response.ok) {
        const error =
          data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};
        const messages: Record<number, string> = {
          401: "Phiên đăng nhập đã hết hạn.",
          403: "Bạn không có quyền truy cập.",
          404: "Không tìm thấy nội dung.",
          409: "Dữ liệu đã thay đổi. Vui lòng tải lại.",
          429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
          503: "Dịch vụ đang tạm gián đoạn.",
        };
        throw new ApiError(
          "http",
          messages[response.status] ??
            "Không thể hoàn tất yêu cầu. Vui lòng thử lại.",
          response.status,
          typeof error.code === "string" ? error.code : undefined,
          response.headers.get("X-Request-Id") ?? undefined,
        );
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted)
        throw new ApiError(
          timedOut ? "timeout" : "cancelled",
          timedOut
            ? "Máy chủ phản hồi chậm. Vui lòng thử lại."
            : "Yêu cầu đã được hủy.",
        );
      throw new ApiError(
        "network",
        "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.",
      );
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  };
}
