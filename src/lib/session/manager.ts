import { ApiError, createApiClient } from "../api/client";
import { isStudentIdentity, StudentIdentity } from "../../types/api";
export type SessionState = {
  status: "loading" | "anonymous" | "authenticated" | "error";
  identity: StudentIdentity | null;
  message?: string;
};
type Storage = {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
};
export function createSessionManager(options: {
  baseUrl: string | null;
  storage: Storage;
  fetcher?: typeof fetch;
}) {
  let state: SessionState = {
    status: "loading",
    identity: null,
  };
  let token: string | null = null,
    generation = 0;
  const listeners = new Set<() => void>();
  const set = (next: SessionState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  const clearLocalSession = async () => {
    generation++;
    token = null;
    set({ status: "anonymous", identity: null });
    await options.storage.clear();
  };
  const api = createApiClient({
    baseUrl: options.baseUrl,
    token: () => token,
    fetcher: options.fetcher,
    onUnauthorized: (rejected) => {
      if (token === rejected)
        void clearLocalSession().catch(() =>
          set({
            status: "error",
            identity: null,
            message: "Không thể xóa phiên đã lưu. Vui lòng thử lại.",
          }),
        );
    },
  });
  async function restore() {
    const attempt = ++generation;
    token = null;
    set({ status: "loading", identity: null });
    try {
      const saved = await options.storage.read();
      if (attempt !== generation) return;
      if (!saved) {
        set({ status: "anonymous", identity: null });
        return;
      }
      token = saved;
      const me = await api<unknown>("/auth/me");
      if (attempt !== generation) return;
      if (!isStudentIdentity(me)) {
        await clearLocalSession();
        return;
      }
      set({ status: "authenticated", identity: me });
    } catch (error) {
      if (attempt !== generation) return;
      token = null;
      set({
        status: "error",
        identity: null,
        message:
          error instanceof ApiError
            ? error.message
            : "Không thể đọc phiên đã lưu. Vui lòng thử lại.",
      });
    }
  }
  let verifying: Promise<void> | undefined;
  function revalidate(): Promise<void> {
    if (verifying) return verifying;
    if (state.status !== 'authenticated' || !token) return restore();
    const attempt = generation, candidate = token, account = state.identity?.accountId;
    const task = (async () => {
      try {
        const me = await api<unknown>('/auth/me');
        if (attempt !== generation || candidate !== token) return;
        if (!isStudentIdentity(me) || me.accountId !== account) { await clearLocalSession(); return; }
        set({ status: 'authenticated', identity: me });
      } catch (error) {
        if (attempt !== generation || candidate !== token) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await clearLocalSession(); return;
        }
        set({ ...state, message: 'Chưa kết nối lại máy chủ. Bạn có thể xem thông tin đã tải và thử cập nhật khi có mạng.' });
      }
    })().finally(() => { if (verifying === task) verifying = undefined; });
    verifying = task;
    return task;
  }

  async function login(username: string, password: string) {
    const attempt = ++generation;
    if (state.status === "authenticated")
      throw new ApiError(
        "http",
        "Vui lòng đăng xuất trước khi đổi tài khoản.",
        409,
      );
    const response = await api<unknown>("/auth/login", {
      method: "POST",
      authenticated: false,
      body: { username: username.trim(), password },
    });
    if (!response || typeof response !== "object")
      throw new ApiError(
        "invalid-response",
        "Phản hồi đăng nhập không hợp lệ.",
      );
    const result = response as Record<string, unknown>;
    if (result.role !== "STUDENT")
      throw new ApiError(
        "http",
        "Ứng dụng này dành cho tài khoản học viên.",
        403,
      );
    if (typeof result.token !== "string" || !result.token)
      throw new ApiError(
        "invalid-response",
        "Thiếu thông tin phiên đăng nhập.",
      );
    const candidate = result.token;
    const probe = createApiClient({
      baseUrl: options.baseUrl,
      token: () => candidate,
      onUnauthorized: () => {},
      fetcher: options.fetcher,
    });
    const me = await probe<unknown>("/auth/me");
    if (!isStudentIdentity(me))
      throw new ApiError(
        "http",
        "Tài khoản chưa được liên kết với hồ sơ học viên.",
        403,
      );
    if (attempt !== generation) return;
    await options.storage.write(candidate);
    if (attempt !== generation) return;
    token = candidate;
    set({ status: "authenticated", identity: me });
  }
  async function logoutAll() {
    let serverConfirmed = false;
    try {
      await api("/auth/me/logout-all", { method: "POST" });
      serverConfirmed = true;
    } catch {
      /* Local logout remains possible when offline. */
    } finally {
      await clearLocalSession();
    }
    return serverConfirmed;
  }
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    api,
    restore,
    revalidate,
    login,
    logoutAll,
    clearLocalSession,

  };
}
