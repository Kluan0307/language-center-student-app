import { safeReturnTo } from "../features/learning/utils";
import { useState, useRef } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSession } from "../providers/SessionProvider";
import { Screen, Heading, Card, Button, StateView } from "../components/ui";
import { Field, ErrorNotice, passwordError } from "../features/account/fields";
export default function ChangePassword() {
  const session = useSession();
  const leaving = useRef(false);
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string>();
  if (session.status !== "authenticated")
    return leaving.current ? (
      <Screen>
        <StateView
          loading
          title="Đang chuyển phiên"
          description="Vui lòng chờ trong giây lát."
        />
      </Screen>
    ) : (
      <Redirect href="/" />
    );
  async function submit() {
    if (busy) return;
    const validation = passwordError(next, confirm);
    if (!current || validation) {
      setError(validation ?? "Nhập mật khẩu hiện tại.");
      return;
    }
    if (current === next) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    const returnTo = safeReturnTo(params.returnTo);
    setBusy(true);
    setError(undefined);
    try {
      await session.api("/auth/me/password", {
        method: "POST",
        body: {
          currentPassword: current,
          newPassword: next,
          confirmPassword: confirm,
        },
      });
      leaving.current = true;
      await session.clearLocalSession();
      router.replace({
        pathname: "/welcome",
        params: {
          passwordChanged: "1",
          ...(returnTo ? { returnTo } : {}),
        },
      });
    } catch (e) {
      leaving.current = false;
      setError(e instanceof Error ? e.message : "Không thể đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Heading
          title={
            session.identity?.mustChangePassword
              ? "Kích hoạt tài khoản"
              : "Đổi mật khẩu"
          }
          subtitle="Sau khi đổi mật khẩu, bạn sẽ đăng nhập lại trên các thiết bị."
        />
        <Card>
          <Field
            label="Mật khẩu hiện tại"
            password
            value={current}
            onChangeText={setCurrent}
            disabled={busy}
          />
          <Field
            label="Mật khẩu mới"
            password
            value={next}
            onChangeText={setNext}
            disabled={busy}
          />
          <Field
            label="Xác nhận mật khẩu mới"
            password
            value={confirm}
            onChangeText={setConfirm}
            disabled={busy}
          />
          {error && <ErrorNotice message={error} />}
          <Button
            title={busy ? "Đang lưu…" : "Lưu mật khẩu mới"}
            disabled={busy}
            onPress={() => {
              void submit();
            }}
          />
          <Button
            title="Thoát tài khoản"
            secondary
            disabled={busy}
            onPress={() => {
              void session
                .logoutAll()
                .then(() => router.replace("/welcome"))
                .catch(() =>
                  setError("Không thể xóa phiên trên máy. Vui lòng thử lại."),
                );
            }}
          />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
