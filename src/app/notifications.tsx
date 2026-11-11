import { SessionGate } from "../components/SessionGate";
import { Unavailable } from "../components/Unavailable";
export default function Notifications() {
  return (
    <SessionGate>
      <Unavailable
        title="Thông báo"
        description="Cập nhật về lịch học, kết quả và thanh toán."
      />
    </SessionGate>
  );
}
