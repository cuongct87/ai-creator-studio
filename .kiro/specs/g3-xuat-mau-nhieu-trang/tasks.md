# G3 — Việc cần làm

Mở PR **thẳng vào `main`**. Mỗi đợt: CI xanh + kịch bản tự kiểm tra trên S24+ rồi mới gửi founder.

## Đợt 1 — Xuất và chia sẻ (R1)
- [ ] K1 (Kiro) `renderPageImage` + tách mã dựng node dùng chung; `exportPageImage` gọi lại nó; test hàm thuần.
- [ ] C1 (Claude) `buildPdf` + test; `movePage`; `cloneDocumentForTemplate`.
- [ ] C2 (Claude) Bảng Xuất (PNG/JPG/PDF, chất lượng, trang, tiến độ); cầu nối Chia sẻ Android (uri MediaStore + ACTION_SEND); web `navigator.share`.
- [ ] C3 (Claude) Kiểm tra: trình duyệt (xuất PNG/PDF đúng khổ), kịch bản điện thoại (xuất ảnh vào Thư viện, PDF vào Tải xuống).

## Đợt 2 — Nhiều trang (R3)
- [ ] K2 (Kiro) Ảnh thu nhỏ trang nhanh (pixelRatio nhỏ, lưu đệm theo phiên bản trang).
- [ ] C4 (Claude) Dải trang + thêm/nhân đôi/xóa/đổi thứ tự trang; EditorScreen theo trang đang mở; xuất nhiều trang; test.

## Đợt 3 — Kho mẫu (R2)
- [ ] C5 (Claude) Đọc điều khoản dùng ảnh Gemini / chữ ChatGPT cho mục đích thương mại → báo founder.
- [ ] C6 (Claude) Bản giao việc cho Gemini (ảnh) và GPT (chữ mẫu).
- [ ] F1 (Founder) Tạo ảnh bằng Gemini, chữ bằng GPT theo bản giao việc; để vào thư mục Claude chỉ định trên laptop.
- [ ] C7 (Claude) Công cụ `tools/mau/` (JSON → .zunva + ảnh thu nhỏ) và 15 mẫu đầu.
- [ ] C8 (Claude) Tab Mẫu (lưới, lọc, tìm), trang chủ → mẫu theo loại, mở mẫu thành dự án mới; test.

## Đợt 4 — Hình nền điện thoại (R4)
- [ ] K3 (Kiro) Prop `guides: 'phone-wallpaper'`: lớp gợi ý mờ, không chạm, không xuất.
- [ ] C9 (Claude) `AndroidShell.screenSize`, loại "Hình nền điện thoại", cầu nối `AndroidWallpaper`, nút "Đặt làm hình nền"; 3 mẫu hình nền; test.

## Founder duyệt
- [x] Duyệt đặc tả G3 (founder duyệt 12/11).
