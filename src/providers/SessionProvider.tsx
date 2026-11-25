import {disableDevice} from '../features/notifications/push';
import {pendingCheckout} from "../features/online/storage";
import {clearPrivateDownloads} from "../features/documents/downloads";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { AppState } from "react-native";
import { getApiBaseUrl } from "../config/runtime";
import { tokenStorage } from "../lib/session/storage";
import { createSessionManager } from "../lib/session/manager";
type Manager = ReturnType<typeof createSessionManager>;
type Session = ReturnType<Manager["getSnapshot"]> & {
  api: Manager["api"];
  login: Manager["login"];
  logoutAll: Manager["logoutAll"];
  retry: () => void;
  clearLocalSession: Manager["clearLocalSession"];
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: React.PropsWithChildren) {
  const apiBaseUrl = getApiBaseUrl();
  const manager = useMemo(() =>
    createSessionManager({
      baseUrl: apiBaseUrl,
      storage: tokenStorage,
    }),
    [apiBaseUrl],
  );
  const state = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot,
  );
  useEffect(() => {
    void manager.restore();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && manager.getSnapshot().status === "authenticated")
        void manager.revalidate();
    });
    return () => sub.remove();
  }, [manager]);
  useEffect(()=>{clearPrivateDownloads();return ()=>clearPrivateDownloads();},[state.identity?.accountId,state.status]);
  useEffect(()=>{if(state.status==="anonymous")void pendingCheckout.clear().catch(()=>{});},[state.status]);
  return (
    <Context.Provider
      value={{
        ...state,
        api: manager.api,
        login: manager.login,
        logoutAll: async()=>{const account=manager.getSnapshot().identity?.accountId;if(account)try{await disableDevice(manager.api,account);}catch{}return manager.logoutAll();},
        retry: () => {
          void (manager.getSnapshot().status === 'authenticated' ? manager.revalidate() : manager.restore());
        },
        clearLocalSession: manager.clearLocalSession,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const session = useContext(Context);
  if (!session) throw new Error("SessionProvider is required");
  return session;
}
