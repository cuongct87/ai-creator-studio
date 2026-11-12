# G2b — Việc cần làm

Thứ tự: C1 trước (Kiro cần kiểu dữ liệu mới). Sau đó Kiro (K) và Claude (C) làm song song. Founder thử 1 lượt bằng APK.

## Claude
- [x] C1 Lõi schema v3: `BlendMode`, `blendMode`, `feather`, `maskAssetId`; `migrateDocument` v2→v3; validate; nhận .zunva v2 và v3; test (dự án cũ mở ra y nguyên).
- [ ] C2 App (đã có: Hòa trộn, Mờ viền, Tách nền, Bỏ hết vùng tẩy, putMask; còn: nối chế độ Tẩy khi Kiro xong K3): mục Hòa trộn, Mờ viền, nút Tẩy / Tách nền / Bỏ hết vùng tẩy; thanh công cụ chế độ tẩy; `onMaskStroke` → asset + op 1 bước.
- [x] C3 Dọn ảnh không dùng khi mở dự án (+ test).
- [x] C4 Tách nền Android (APK dựng được; chờ thử trên S24+): đọc điều khoản ML Kit → báo founder; cầu nối Java + `segmentSubject`; manifest tải mô hình lúc cài.
- [ ] C5 Kiểm tra trình duyệt (hòa trộn, mờ viền, tẩy bằng chuột), CI xanh, dựng APK gửi founder.

## Kiro (chỉ sửa trong `zunva/packages/editor-canvas/`)
- [x] K1 `blendMode` cho mọi lớp → `globalCompositeOperation`; ảnh xuất giống màn hình.
- [x] K2 Lớp ảnh có mặt nạ / mờ viền: vẽ qua canvas phụ (lật, mặt nạ, bo góc + blur), lưu đệm theo khóa; giới hạn 2048 px.
- [x] K3 Chế độ tẩy: prop `brush`, `onMaskStroke`; 1 ngón tô (erase/restore, cỡ, độ mềm, nét liền), 2 ngón phóng trang; xem trước ngay; nhấc ngón → PNG.
- [x] K4 Test hàm thuần (Vitest, `geometry.ts` hoặc file mới): trang → khung lớp (xoay, lật), nội suy nét, khóa lưu đệm.
- [x] K5 README: cập nhật bảng hợp đồng (prop mới, nhãn hoàn tác).
- [x] K6 Lớp mỏng: nút ↻ góc đẩy ra ngoài theo đường chéo khi cạnh trên màn hình < 88 px (cách nhau ≥ 44 px).

> Kiro, 12/11: K1–K6 đã viết xong file nhưng **chưa chạy CI** (terminal Kiro hỏng). Chưa thử trên trình duyệt / S24+.
> File: `editor-canvas/src/DesignCanvas.tsx`, `index.ts`, `README.md`; mới: `src/mask.ts`, `src/mask.test.ts`, `src/composite.ts`.
> Chưa chắc: Konva áp `globalCompositeOperation` đúng cho mọi kiểu hình; độ mềm thật của mép (blur) và cọ; hiệu năng tẩy trên ảnh lớn.
- [ ] K6 Lớp thấp: đẩy nút ↻ ra ngoài để không che nút kéo dãn (founder thử 12/11).

## Founder duyệt
- [x] Duyệt đặc tả này (requirements + design + tasks) — founder duyệt 12/11.
- [x] Duyệt dùng ML Kit (founder đồng ý 12/11) sau khi Claude báo điều khoản: ảnh không gửi đi; ML Kit gửi số liệu hiệu năng/sử dụng cho Google (phải ghi trong chính sách riêng tư); bản beta; trang điều khoản không ghi phí.
