import { Redirect } from "expo-router";
import { useSession } from "../providers/SessionProvider";
import { Unavailable } from "../components/Unavailable";
export default function ChangePassword() {
  const session = useSession();
  if (session.status !== "authenticated") return <Redirect href="/" />;
  if (!session.identity?.mustChangePassword) return <Redirect href="/" />;
  return (
    <Unavailable
      title="Kích hoạt tài khoản"
      description="Bạn cần đổi mật khẩu để tiếp tục. Dịch vụ kích hoạt tài khoản sẽ được mở cùng hệ thống học viên."
    />
  );
}
