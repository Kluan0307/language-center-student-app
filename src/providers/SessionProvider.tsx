import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createApiClient, ApiError } from "../lib/api/client";
import { apiBaseUrl } from "../config/env";
import { tokenStorage } from "../lib/session/storage";
import { isStudentIdentity, StudentIdentity } from "../types/api";
type State = {
  status: "loading" | "anonymous" | "authenticated" | "error";
  identity: StudentIdentity | null;
  preview: boolean;
  message?: string;
};
type Session = State & {
  api: ReturnType<typeof createApiClient>;
  retry: () => void;
  startPreview: () => void;
  endPreview: () => void;
  clearLocalSession: () => Promise<void>;
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<State>({
    status: "loading",
    identity: null,
    preview: false,
  });
  const token = useRef<string | null>(null);
  const revision = useRef(0);
  const clearLocalSession = useCallback(async () => {
    revision.current++;
    token.current = null;
    setState({ status: "anonymous", identity: null, preview: false });
    await tokenStorage.clear();
  }, []);
  const [api] = useState(() =>
    createApiClient({
      baseUrl: apiBaseUrl,
      token: () => token.current,
      onUnauthorized: (rejected) => {
        if (token.current === rejected)
          void clearLocalSession().catch(() =>
            setState({
              status: "error",
              identity: null,
              preview: false,
              message: "Không thể xóa phiên đã lưu. Vui lòng thử lại.",
            }),
          );
      },
    }),
  );
  const restore = useCallback(async () => {
    const current = ++revision.current;
    setState({ status: "loading", identity: null, preview: false });
    try {
      const saved = await tokenStorage.read();
      if (current !== revision.current) return;
      token.current = saved;
      if (!saved) {
        setState({ status: "anonymous", identity: null, preview: false });
        return;
      }
      const identity = await api<unknown>("/auth/me");
      if (current !== revision.current) return;
      if (!isStudentIdentity(identity)) {
        await clearLocalSession();
        return;
      }
      setState({ status: "authenticated", identity, preview: false });
    } catch (error) {
      if (current !== revision.current) return;
      if (error instanceof ApiError && error.status === 401) return;
      setState({
        status: "error",
        identity: null,
        preview: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể khôi phục phiên đăng nhập.",
      });
    }
  }, [api, clearLocalSession]);
  useEffect(() => {
    void restore();
    return () => {
      revision.current++;
    };
  }, [restore]);
  const startPreview = () => {
    if (__DEV__ && state.status === "anonymous")
      setState({ status: "anonymous", identity: null, preview: true });
  };
  const endPreview = () =>
    setState({ status: "anonymous", identity: null, preview: false });
  return (
    <Context.Provider
      value={{
        ...state,
        api,
        retry: () => {
          void restore();
        },
        startPreview,
        endPreview,
        clearLocalSession,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider is required");
  return value;
}
