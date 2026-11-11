# Language Center Student App

React Native + TypeScript + Expo. Dự án hiện là template blank; chưa có Expo Router hoặc chức năng học viên chạy thật.

## Giai đoạn 1 — hoàn thành thiết kế ngày 11/11/2026

Tài liệu chuẩn nằm trong backend để đối chiếu cùng domain/API:

- [Tổng quan và khoảng trống hiện tại](../language-center-backend/language-center-backend/docs/student-app/README.md)
- [Nghiệp vụ, dữ liệu và phân quyền](../language-center-backend/language-center-backend/docs/student-app/domain-and-access.md)
- [Draft API dự kiến — chưa triển khai](../language-center-backend/language-center-backend/docs/student-app/api-contract.md)
- [Màn hình, 10 giai đoạn và 20 tình huống nghiệm thu](../language-center-backend/language-center-backend/docs/student-app/delivery-plan.md)

Điều hướng dự kiến: Trang chủ / Lịch học / Học tập / Học phí / Cá nhân; inbox từ header. Nhận diện theo web, thành phần native. Bản cơ bản bao gồm thanh toán sandbox và thông báo; chưa có provider credentials thì chưa nghiệm thu các phần đó.

## Chạy template

```powershell
npm ci
npm start
```

Kiểm tra TypeScript: `npx tsc --noEmit`. Điện thoại gọi backend bằng IP LAN hoặc HTTPS server, không dùng localhost máy tính. Không đưa DB_PASSWORD/JWT_SECRET/provider secrets vào EXPO_PUBLIC_* hoặc source.

## Tiếp theo

Giai đoạn 2: cấu trúc thư mục, điều hướng, theme, UI components, API client và xử lý lỗi/phiên; chưa dựng dữ liệu giả thành chức năng đã hoàn thành. Giai đoạn 3 mới triển khai STUDENT và liên kết tài khoản. Giữ nguyên bản release web đã nghiệm thu.
