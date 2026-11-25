import { safeReturnTo } from "../features/learning/utils";
import { SessionStatus } from "../components/SessionStatus";
import { useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Button, Card, Heading, Screen, textStyles } from "../components/ui";
import { useSession } from "../providers/SessionProvider";
import { ErrorNotice, Field } from "../features/account/fields";
import { ApiError } from "../lib/api/client";
export default function Welcome() {
  const session = useSession();
  const params = useLocalSearchParams<{
    passwordChanged?: string;
    returnTo?: string;
  }>();
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string>();
  if (session.status === "loading" || session.status === "error")
    return <SessionStatus />;
  if (session.status === "authenticated")
    return <Redirect href={safeReturnTo(params.returnTo) ?? "/"} />;
  async function login() {
    if (busy) return;
    setError(undefined);
    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    setBusy(true);
    try {
      await session.login(username, password);
      setPassword("");
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? "Tên đăng nhập hoặc mật khẩu chưa đúng, hoặc tài khoản đã bị khóa."
          : e instanceof Error
            ? e.message
            : "Không thể đăng nhập.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Screen>
        <Heading
          title="Chào mừng đến Language Center"
          subtitle="Theo dõi việc học của bạn, mọi lúc mọi nơi."
        />
        <Card>
          <Text style={textStyles.section}>Đăng nhập học viên</Text>
          {params.passwordChanged === "1" && (
            <Text style={textStyles.body}>
              Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.
            </Text>
          )}
          <Field
            label="Tên đăng nhập"
            username
            value={username}
            onChangeText={setUsername}
            disabled={busy}
          />
          <Field
            label="Mật khẩu"
            password
            value={password}
            onChangeText={setPassword}
            disabled={busy}
          />
          {error && <ErrorNotice message={error} />}
          <Button
            title={busy ? "Đang đăng nhập…" : "Đăng nhập"}
            disabled={busy}
            onPress={() => {
              void login();
            }}
          />
          <Button
            title="Quên mật khẩu / Hỗ trợ tài khoản"
            secondary
            disabled={busy}
            onPress={() => router.push("/contact")}
          />
          <Text style={textStyles.body}>
            Dùng tài khoản trung tâm đã cấp. Không tự đăng ký bằng mã học viên.
          </Text>
        </Card>

      </Screen>
    </>
  );
}
