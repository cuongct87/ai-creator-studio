# G2b — Việc cần làm

Thứ tự: C1 trước (Kiro cần kiểu dữ liệu mới). Sau đó Kiro (K) và Claude (C) làm song song. Founder thử 1 lượt bằng APK.

## Claude
- [ ] C1 Lõi schema v3: `BlendMode`, `blendMode`, `feather`, `maskAssetId`; `migrateDocument` v2→v3; validate; nhận .zunva v2 và v3; test (dự án cũ mở ra y nguyên).
- [ ] C2 App: mục Hòa trộn, Mờ viền, nút Tẩy / Tách nền / Bỏ hết vùng tẩy; thanh công cụ chế độ tẩy; `onMaskStroke` → asset + op 1 bước.
- [ ] C3 Dọn ảnh không dùng khi mở dự án (+ test).
- [ ] C4 Tách nền Android: đọc điều khoản ML Kit → báo founder; cầu nối Java + `segmentSubject`; manifest tải mô hình lúc cài.
- [ ] C5 Kiểm tra trình duyệt (hòa trộn, mờ viền, tẩy bằng chuột), CI xanh, dựng APK gửi founder.

## Kiro (chỉ sửa trong `zunva/packages/editor-canvas/`)
- [ ] K1 `blendMode` cho mọi lớp → `globalCompositeOperation`; ảnh xuất giống màn hình.
- [ ] K2 Lớp ảnh có mặt nạ / mờ viền: vẽ qua canvas phụ (lật, mặt nạ, bo góc + blur), lưu đệm theo khóa; giới hạn 2048 px.
- [ ] K3 Chế độ tẩy: prop `brush`, `onMaskStroke`; 1 ngón tô (erase/restore, cỡ, độ mềm, nét liền), 2 ngón phóng trang; xem trước ngay; nhấc ngón → PNG.
- [ ] K4 Test hàm thuần (Vitest, `geometry.ts` hoặc file mới): trang → khung lớp (xoay, lật), nội suy nét, khóa lưu đệm.
- [ ] K5 README: cập nhật bảng hợp đồng (prop mới, nhãn hoàn tác).

## Founder duyệt
- [ ] Duyệt đặc tả này (requirements + design + tasks).
- [ ] Duyệt dùng ML Kit (miễn phí, chạy trên máy, bản beta) sau khi Claude báo điều khoản.
