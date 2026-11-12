import { useState } from "react";
import { Text } from "react-native";
import { useSession } from "../providers/SessionProvider";
import { Button, Screen, StateView } from "./ui";
import { theme } from "../theme/tokens";
export function SessionStatus() {
  const session = useSession();
  const [error, setError] = useState<string>();
  return (
    <Screen>
      <StateView
        title={
          session.status === "loading"
            ? "Đang mở ứng dụng"
            : "Chưa thể mở phiên"
        }
        description={session.message ?? "Vui lòng chờ trong giây lát."}
        loading={session.status === "loading"}
        action={
          session.status === "error"
            ? { title: "Thử lại", onPress: session.retry }
            : undefined
        }
      />
      {session.status === "error" && (
        <Button
          title="Thoát phiên trên thiết bị này"
          secondary
          onPress={() => {
            void session
              .clearLocalSession()
              .catch(() => setError("Chưa xóa được phiên. Vui lòng thử lại."));
          }}
        />
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {error}
        </Text>
      )}
    </Screen>
  );
}
