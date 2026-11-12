# G2 — Danh sách việc

Đọc trước: `requirements.md`, `design.md`. Luật chung: `.kiro/steering/zunva-rules.md`.
Thứ tự: Kiro làm **K1 → K5** (song song với Claude **C1 → C6**). Hai bên chỉ sửa thư mục của mình (xem `design.md`).

## Kiro — `zunva/packages/editor-canvas/` (dự toán 250–450 credit), nhánh `feat/g2-editor-canvas`
- [ ] K1 Tạo gói `@zunva/editor-canvas` (react 19, konva 10.9.1, react-konva 19.3.2 — cùng bản G1-4), xuất đúng hợp đồng trong `design.md`. Lint: được dùng React/DOM, không sửa `core`.
- [ ] K2 Vẽ lớp chữ / ảnh / hình từ `DesignDocument`; nền trang màu hoặc ảnh; ô xám khi ảnh chưa có URL.
- [ ] K3 Chọn, kéo, phóng, xoay (Transformer, tay nắm đủ lớn cho ngón tay ≥ 44px), chụm hai ngón phóng trang, `fitToScreen()`; phát `Op` + `mergeKey` + `onGestureEnd` đúng hợp đồng.
- [ ] K4 Sửa chữ tại chỗ (ô nhập HTML phủ lên, giữ cách G1-4 đã đạt Telex/VNI); 6 phông OFL qua `@fontsource` (Be Vietnam Pro, Playfair Display, Dancing Script, Lora, Montserrat, Pacifico) — chỉ nạp bộ chữ Latin + Vietnamese (kiểm tra từng phông có bộ `vietnamese`; thiếu thì báo, đề xuất phông thay); `fontsReady()`.
- [ ] K5 `exportPageImage(pixelRatio)` theo đúng khung trang. Test: Vitest cho phần tính toán (đổi tọa độ, gộp lệnh); trang thử `apps/poc-konva` hoặc test Playwright dùng gói mới; mở PR, báo credit.

## Claude — `zunva/apps/web/` (+ chỉnh nhỏ `core`/`platform`/`android`), nhánh `feat/g2-app-shell`
- [ ] C1 Đổi tên **Artio** (R1): `PRODUCT_NAME`, nhãn Android, tiêu đề trang, thư mục lưu `Tải xuống/Artio`, `Ảnh/Artio`.
- [ ] C2 Chủ đề màu Xanh nhạt / Hồng phấn / Tối (R2), nút đổi ở Tài khoản và trang chủ, test tương phản chữ.
- [ ] C3 Trang chủ (R3): câu hỏi + ô tìm (không dấu vẫn ra), "Tiếp tục thiết kế", nút tròn theo mục đích tạo dự án đúng khổ, ô xám khi tải.
- [ ] C4 Khung chỉnh sửa (R4): thanh công cụ (thêm chữ/ảnh/hình, hoàn tác/làm lại, vừa màn hình), bảng thuộc tính theo loại lớp, lớp (lên/xuống/khóa/xóa/nhân đôi), nền trang, tự lưu, nút Back. Dùng bản tạm của canvas cho tới khi K1–K5 xong.
- [ ] C5 Hộp hỏi riêng thay `confirm()`; hướng dẫn tìm file `.zunva` (R6).
- [ ] C6 Gắn `@zunva/editor-canvas` của Kiro; Playwright: tạo thiệp cưới → thêm chữ/hình → hoàn tác/làm lại → tải lại trang vẫn còn.

## Nghiệm thu
- [ ] CI xanh; APK ký khóa (workflow G1-7) cài trên S24+.
- [ ] Founder làm 5 bước nghiệm thu trong `requirements.md`.
