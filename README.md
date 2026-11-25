# Language Center — Ứng dụng học viên

React Native, TypeScript và Expo. Ứng dụng dùng API thật qua Gateway, gồm đăng nhập/hồ sơ, lớp và lịch học, điểm đã công bố, chuyên cần, tài liệu, hỗ trợ, học phí, phiếu thu, thanh toán VNPAY sandbox và thông báo trong ứng dụng.

Màn hình xem trước, nút khám phá không đăng nhập và hướng dẫn thẻ test trong giao diện đã được gỡ. Bộ kiểm thử được giữ trong `tests/`, không phải giao diện người dùng và không đóng gói thành chức năng app.

Bản cài nội bộ mới: **1.1.0 (versionCode 2)**, [APK Android ARM64 ~28,8 MB](artifacts/LanguageCenter-1.1.0-sandbox-arm64-20261115014613.apk). Đã xác minh chữ ký khớp bản 1.0.0 trước, không debuggable, phiên bản và HTTPS API nhúng đúng, không đóng gói endpoint/dữ liệu giả lập. Xem [manifest/SHA-256](artifacts/latest-android.json) và [báo cáo xác minh](artifacts/latest-android-verification.json). Chưa có thiết bị kết nối để nghiệm thu native. Gateway/ngrok hiện chưa hoạt động, cần bật lại trước khi đăng nhập.

## Chạy phát triển

```powershell
npm ci
npm run start:go -- --port 8085
```

Chạy một Metro server, dùng Expo Go tương thích SDK dự án. Cổng 8081 của hệ thống dành cho Auth; dùng 8085 cho Metro. Với development build đã cài: `npm run start:dev -- --port 8085`.

Copy `.env.example` thành `.env.local`, điền Gateway phù hợp:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://<IP-LAN-may-tinh>:8080/api/v1
```

Điện thoại và máy tính cùng mạng khi dùng LAN. `localhost` trên điện thoại là chính điện thoại. Restart Metro khi đổi env. Bản bàn giao cài độc lập phải dùng HTTPS Gateway; không dùng HTTP LAN. Không đưa DB_PASSWORD, JWT_SECRET, VNPAY_HASH_SECRET hoặc Expo access token vào app hay biến EXPO_PUBLIC.

## Kiểm tra trước bàn giao

```powershell
npm run typecheck
npm test
```

Kiểm tra cấu hình release với Gateway HTTPS thực tế:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL='https://<gateway>/api/v1'
npm run check:release
```

Các số tiền dùng decimal string; không xác nhận thanh toán từ Return URL hoặc thao tác đóng browser. Quyền học viên luôn được backend kiểm lại. App không có chế độ xem trước để bỏ qua đăng nhập.

## Build APK Android local trên Windows

Cần JDK tương thích Gradle, Android SDK và các thành phần đúng phiên bản trong `node_modules/react-native/gradle/libs.versions.toml`. Bản hiện tại yêu cầu compile SDK 37, Build Tools 37.0.0 và NDK 27.1.12297006; Gradle có thể cài khi máy đã chấp nhận license và có mạng. Nên chạy build sau khi kết thúc kiểm thử, tránh nhiều tác vụ nặng đồng thời.

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:EXPO_PUBLIC_API_BASE_URL='https://<gateway>/api/v1'
npm run check:release
npm run build:android:local
```

Lệnh tạo Android project nếu chưa có, dùng giới hạn Gradle/Node cho máy phát triển, build variant release cho `arm64-v8a` rồi chép APK vào `artifacts/`. Xem `artifacts/latest-android.json` để lấy đường dẫn và SHA-256. Android project là output được ignore, không tự sửa hoặc xóa project native của người khác bằng `--clean`.

APK local dùng signing của Android project; template hiện dùng debug keystore, chỉ dành cho cài nội bộ/nghiệm thu, không phải bản phát hành Google Play đã có khóa phát hành riêng. Không đưa keystore hay mật khẩu ký vào Git.

Khi có điện thoại:

```powershell
adb devices
adb install -r .\artifacts\<ten-file-apk>.apk
```

Cho phép cài ứng dụng và USB debugging trên máy của bạn. Đăng nhập bằng tài khoản STUDENT do trung tâm cấp. Bản APK release chạy không cần Metro/Expo Go; Gateway và các service vẫn phải hoạt động. Nếu dùng ngrok, tunnel phải còn chạy và URL phải khớp URL đã build trong APK.

## Build qua EAS khi có tài khoản

`eas.json` có `development` cho development client, `preview` cho APK nội bộ và `production` cho AAB. Preview/production yêu cầu API HTTPS, không chấp nhận simulator thanh toán hoặc biến public chứa secret.

1. Đăng nhập EAS và liên kết đúng project: `eas login`, `eas init`.
2. Đặt EXPO_PUBLIC_API_BASE_URL trong EAS environment `preview` hoặc `production`. `.env.local` được loại khỏi gói upload; không dựa vào nó trên cloud.
3. Nếu dùng Android applicationId khác, đặt EXPO_ANDROID_PACKAGE nhất quán trước khi cấp khóa ký/Firebase. Mặc định hiện tại là `com.languagecenter.student`.
4. Chạy `eas build --platform android --profile preview` hoặc `eas build --platform android --profile production` theo bản cần dùng.

Không tự submit lên store trong quy trình này. Profile production không tự biến VNPAY sandbox thành cổng thanh toán tiền thật; backend hiện hỗ trợ sandbox và app vẫn hiển thị đúng môi trường.

Tham khảo chính thức: [APK](https://docs.expo.dev/build-reference/apk/), [EAS build profiles](https://docs.expo.dev/build/eas-json/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/usage/).

## Thanh toán và thông báo

- Học phí → chọn khoản → xác nhận → VNPAY → quay lại app → kiểm tra kết quả → phiếu thu. Không trả tiền lần nữa khi giao dịch chưa rõ kết quả.
- VNPAY sandbox dùng thẻ thử do nhà cung cấp cấp, xem [hướng dẫn VNPAY](https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/). Hướng dẫn này nằm trong tài liệu, không hiển thị số thẻ/OTP trong giao diện sản phẩm.
- Return và IPN là hai URL khác nhau. IPN phải được đăng ký đúng merchant, không có ký tự `#` ở đầu. Đơn cũ có thể cần ADMIN/SUPER_ADMIN đối soát từ web; không ghi phiếu giả để xử lý trạng thái chờ.
- Inbox luôn dùng được khi server hoạt động. Push ngoài ứng dụng cần EAS project/Firebase/FCM và build phù hợp; nếu chưa khả dụng thì app không hiển thị các thao tác đăng ký không dùng được.

## Web preview và tài liệu

Nếu mở Expo web tại `http://localhost:8085`, Gateway cần cho phép đúng origin đó trong CORS_ALLOWED_ORIGINS, bên cạnh origin web quản trị. Native Android không dùng cơ chế CORS của browser. Không tắt CORS của Gateway để xử lý lỗi preview.

- [Lộ trình và ma trận nghiệm thu](../language-center-backend/language-center-backend/docs/student-app/delivery-plan.md)
- [Hợp đồng API](../language-center-backend/language-center-backend/docs/student-app/api-contract.md)
- [Hướng dẫn tài khoản](../language-center-backend/language-center-backend/docs/student-app/account-user-guide.md)
- [Tối ưu thanh toán](../language-center-backend/language-center-backend/docs/student-app/payment-flow-phases-1-4-completion.md)
- [Kết quả giai đoạn 10](../language-center-backend/language-center-backend/docs/student-app/phase-10-completion.md)

Không reset database để nâng cấp app. Dữ liệu demo, test fixture và khóa thử nghiệm của các bộ kiểm chứng nằm ngoài luồng runtime của bản bàn giao.

## Cập nhật trải nghiệm M1–M3 (15/11/2026)

Giữ năm tab; chuẩn hóa nút, bộ chọn, trạng thái và bảng lọc. Trang chủ ưu tiên buổi học tiếp theo, lịch có thanh ngày/chuyển tuần và ba chế độ Ngày–Tuần–Lưới giờ. Kéo để cập nhật ở Trang chủ, Lịch học và chi tiết buổi. Quy tắc học phí/VNPAY và API giữ nguyên.

Kế hoạch và tiêu chí nghiệm thu: `../language-center-backend/language-center-backend/docs/student-app/mobile-ux-m1-m3.md`. Chạy `npm run typecheck` và `npm test`. Cần mở lại Metro để xem code mới; APK đã cài trước đây cần build/cài lại để nhận cập nhật. M4–M8 vẫn là các giai đoạn tiếp theo.

## Cập nhật M4–M6

Học tập tập trung theo từng lớp; học phí tách khoản cần đóng, phiếu thu và giao dịch online; thông báo mở trực tiếp nội dung; hỗ trợ giữ ngữ cảnh lớp/buổi/hồ sơ/khoản thu. Cá nhân và cài đặt được thu gọn. Xem `../language-center-backend/language-center-backend/docs/student-app/mobile-ux-m4-m6.md` để biết phạm vi và kết quả kiểm tra. APK cũ cần build/cài lại.

## M7–M8: hiệu năng và bản cài 1.1.0

Cache RAM riêng theo tài khoản, gộp truy vấn trùng, giữ thông tin đã tải kèm thời gian khi mạng lỗi, loại dữ liệu bị từ chối quyền và giữ bản nháp khi xác thực lại phiên. Học phí/điểm/điều kiện thanh toán tiếp tục kiểm tra mới; không có đăng nhập hoặc thanh toán offline. Luồng lớp → điểm → lớp → chuyên cần → lớp giảm GET cùng lớp từ 5 xuống 1 trong kiểm thử tổng hợp.

TypeScript, 108 tests, 69 tình huống UI/hồi quy và build Android đã đạt. M8 còn nghiệm thu trên thiết bị thật, push và VNPAY thật qua app sau khi backend/ngrok hoạt động. Kế hoạch, kết quả và hướng dẫn cài: `../language-center-backend/language-center-backend/docs/student-app/mobile-ux-m7-m8.md`.

APK này dùng `https://subsystem-handwork-subscript.ngrok-free.dev/api/v1`. URL LAN trong `.env.local` dành cho Expo không thay đổi APK đã build; đổi domain HTTPS thì cần build lại. Build lặp lại bằng `npm run check:release` rồi `npm run build:android:local` với EXPO_PUBLIC_API_BASE_URL HTTPS trong môi trường tiến trình.

## Phân loại khóa học G5–G6

Website/CMS và mobile dùng chương trình/đối tượng chuẩn từ backend. Không tự suy đoán tuổi hoặc trình độ. Mã mobile đã cập nhật nhưng chưa build APK mới. [Bàn giao và giới hạn kiểm thử](docs/course-classification/g5-g6-handoff.md).
