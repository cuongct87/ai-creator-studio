# G4 — Việc cần làm

Mở PR **thẳng vào `main`**. Mỗi đợt: CI xanh + kịch bản tự kiểm tra trên laptop founder (và S24+ nếu đụng phần chung) rồi mới gửi duyệt gộp.

## Đợt 1 — Bản Windows chạy được
- [ ] C1 (Claude) `zunva/apps/desktop/src-tauri`: cấu hình Tauri 2, lệnh `save_file`, plugin `opener`, quyền tối thiểu, CSP, biểu tượng tạm.
- [ ] C2 (Claude) `tauri-platform.ts` + `createPlatform()` nhận Windows; `Platform.reveal` + nút "Mở thư mục" trong bảng Xuất; unit test.
- [ ] C3 (Claude) Workflow `windows-installer.yml` → artifact `artio-windows-setup`.
- [ ] C4 (Claude) Kịch bản `kiem-tra-windows` (mở app, tạo thiết kế, mở mẫu, xuất PNG/PDF, lưu `.zunva`, kiểm file trên ổ đĩa).
- [ ] F1 (Founder) Cài bản Windows trên laptop, chạy `chay-kiem-tra-windows.bat`, thử tay vài phút.

## Đợt 2 — Dùng như app máy tính
- [ ] C5 (Claude) Bố cục màn hình rộng (≥ 900 px) cho trang chủ, Dự án, Mẫu, màn chỉnh sửa; điện thoại không đổi.
- [ ] C6 (Claude) Phím tắt (Ctrl+Z/Y, Delete, Esc, mũi tên) + kéo thả ảnh/`.zunva`; test.
- [ ] K1 (Kiro) Con trỏ chuột theo vị trí (lớp, tay nắm đổi cỡ, nút xoay) trong `editor-canvas`.
- [ ] C7 (Claude) Test giao diện khổ 1280×800 trong CI; thêm bước vào kịch bản laptop; chạy lại kịch bản điện thoại (phần chung).

## Founder duyệt
- [ ] Duyệt đặc tả G4.
