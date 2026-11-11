import { SessionGate } from "../components/SessionGate";
import { Unavailable } from "../components/Unavailable";
export default function Settings() {
  return (
    <SessionGate>
      <Unavailable
        title="Cài đặt"
        description="Tùy chọn thông báo sẽ được mở cùng dịch vụ học viên."
      />
    </SessionGate>
  );
}
