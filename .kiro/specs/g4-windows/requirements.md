# G4 — Artio trên Windows (cùng mã với Android)

Ngày 12/11/2026 founder chọn: làm G4 trước, gồm bản Windows chạy song song với bản Android.
Hai bản macOS và iOS để sau (G5; phí Apple Developer cần founder duyệt riêng).

## Mục tiêu
Cài Artio trên laptop Windows 10/11 và dùng được mọi thứ đang có trên Android: trang chủ, mẫu,
chỉnh sửa, nhiều trang, xuất ảnh/PDF, lưu và mở file `.zunva`. Cả hai bản dùng **cùng một mã giao diện**
(`zunva/apps/web`): sửa một lần thì hai bản cùng có.

## R1 Cài đặt và mở app
- File cài `Artio_<phiên bản>_x64-setup.exe`, dung lượng mục tiêu dưới 15 MB, cài cho riêng người dùng (không cần quyền quản trị).
- Có biểu tượng ở menu Start và (tùy chọn) ngoài màn hình nền. Tên hiển thị "Artio".
- **Chưa ký số** (không tốn phí). Lần đầu Windows hiện "Windows đã bảo vệ máy tính của bạn": bấm "Thông tin thêm" → "Vẫn chạy".
  Ký số để khỏi cảnh báo: để lúc phát hành, founder duyệt chi phí riêng.
- Cửa sổ mở ở kích thước 1280×800 (máy màn hình nhỏ hơn thì vừa màn hình), kéo to nhỏ được, nhỏ nhất 360×640.
- Cài bản mới **đè** lên bản cũ không mất dự án. Gỡ app **không** tự xóa dự án (hỏi riêng nếu có tùy chọn xóa).

## R2 Giao diện trên màn hình máy tính
- Trang chủ, Dự án, Mẫu: nội dung ở giữa, rộng tối đa vừa đọc; lưới mẫu nhiều cột hơn khi cửa sổ rộng.
- Màn chỉnh sửa: vùng vẽ chiếm phần lớn cửa sổ; thanh công cụ và bảng chỉnh giữ như điện thoại (không làm lại bố cục ở G4).
- Chuột: kéo để di chuyển, nút tay nắm để đổi cỡ/xoay, lăn chuột để phóng to/thu nhỏ (đã có), con trỏ đổi hình hợp lý.
- Phím tắt: Ctrl+Z hoàn tác, Ctrl+Y / Ctrl+Shift+Z làm lại, Delete xóa lớp đang chọn (có hỏi lại như nút Xóa),
  Esc bỏ chọn, phím mũi tên dời lớp 1 px (Shift: 10 px). Không bắt phím khi đang gõ chữ.
- Kéo thả file ảnh từ Explorer vào vùng vẽ = thêm ảnh. Kéo thả file `.zunva` vào trang Dự án = mở thành dự án.

## R3 Lưu file và mở file
- Xuất ảnh PNG/JPG → `Ảnh (Pictures)\Artio`. Xuất PDF và lưu `.zunva` → `Tải xuống (Downloads)\Artio`.
  Trùng tên thì thêm "(2)", "(3)"… không ghi đè.
- Xuất xong có nút **"Mở thư mục"** (mở Explorer, chọn sẵn file). Nút "Chia sẻ" của Android không có trên Windows.
- Chọn ảnh: hộp chọn file của Windows, lọc ảnh PNG/JPG/WebP. Mở `.zunva`: hộp chọn file.

## R4 Tính năng chưa có trên Windows ở G4 (ẩn nút, không báo lỗi)
- **Tách nền tự động** (ML Kit chỉ có trên Android). Cục tẩy tay vẫn dùng được. Làm tách nền trên máy tính: bước riêng sau G4.
- **Đặt làm hình nền** (chỉ cho hình nền điện thoại). Loại "Hình nền điện thoại" vẫn tạo và xuất ảnh được.

## R5 Dữ liệu và an toàn
- Dự án lưu trong máy (thư mục dữ liệu của app), không gửi lên mạng, không tài khoản. Dữ liệu Windows và Android **riêng nhau**
  (chuyển qua lại bằng file `.zunva`). Đồng bộ: sau 1.0.
- App chỉ được ghi vào `Pictures\Artio` và `Downloads\Artio`, chỉ đọc file người dùng tự chọn hoặc kéo thả. Không tải mã từ mạng.
- Không khóa bí mật nào trong repo; bản cài làm trong GitHub Actions (repo công khai → máy dựng Windows miễn phí).

## R6 Kiểm tra
- CI: build bản cài Windows mỗi lần dựng; test giao diện hiện có chạy thêm ở khổ cửa sổ máy tính 1280×800.
- Kịch bản tự kiểm tra trên laptop founder (giống bản điện thoại): `chay-kiem-tra-windows.bat` mở Artio đã cài,
  tự bấm các bước, chụp ảnh, ghi `bao-cao.md`. Đạt hết trên laptop founder rồi mới gửi duyệt gộp.

## Ngoài phạm vi G4
- macOS, iOS, iPadOS (G5). Microsoft Store. Tự cập nhật app. Ký số. Tách nền trên máy tính. Bố cục màn chỉnh sửa riêng cho máy tính lớn.
