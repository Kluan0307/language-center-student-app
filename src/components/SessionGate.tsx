import { Redirect } from "expo-router";
import { useSession } from "../providers/SessionProvider";
import { Screen, StateView } from "./ui";
export function SessionGate({ children }: React.PropsWithChildren) {
  const session = useSession();
  if (session.status === "loading")
    return (
      <Screen>
        <StateView
          title="Đang mở ứng dụng"
          description="Vui lòng chờ trong giây lát."
          loading
        />
      </Screen>
    );
  if (session.status === "error")
    return (
      <Screen>
        <StateView
          title="Chưa thể mở phiên"
          description={session.message ?? "Vui lòng thử lại."}
          action={{ title: "Thử lại", onPress: session.retry }}
        />
      </Screen>
    );
  if (!session.preview && session.status !== "authenticated")
    return <Redirect href="/welcome" />;
  if (session.identity?.mustChangePassword)
    return <Redirect href="/change-password" />;
  return children;
}
