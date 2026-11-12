# G3 — Việc cần làm

Mở PR **thẳng vào `main`**. Mỗi đợt: CI xanh + kịch bản tự kiểm tra trên S24+ rồi mới gửi founder.

## Đợt 1 — Xuất và chia sẻ (R1)
- [x] K1 (Kiro) `renderPageImage` + tách mã dựng node dùng chung; `exportPageImage` gọi lại nó; test hàm thuần.
  > Kiro 12/11: mới `PageScene.tsx` (mã vẽ chung), `renderPage.tsx`, `exportImage.ts` + test; sửa `DesignCanvas.tsx`, `index.ts`, `README.md`.
- [x] C1 (Claude) `buildPdf` + test; `movePage`; `cloneDocumentForTemplate`.
- [x] C2 (Claude) Bảng Xuất (PNG/JPG/PDF, chất lượng, trang, tiến độ); cầu nối Chia sẻ Android (uri MediaStore + ACTION_SEND); web `navigator.share`.
- [x] C3 (Claude; S24+ 20/20: xuất PNG 0,45 s, PDF 0,8 s, mặt nạ tẩy 0,02 s) Kiểm tra: trình duyệt (xuất PNG/PDF đúng khổ), kịch bản điện thoại (xuất ảnh vào Thư viện, PDF vào Tải xuống).

## Đợt 2 — Nhiều trang (R3)
- [x] K2 (Kiro) Ảnh thu nhỏ trang nhanh (pixelRatio nhỏ, lưu đệm theo phiên bản trang).
  > Kiro: mới `usePageThumbnails.ts`, `thumbnails.ts` + `thumbnails.test.ts`; sửa `index.ts`, `README.md`. **Chưa chạy CI/máy.**
  > Chưa chắc: tốc độ khi nhiều trang (mỗi ảnh thu nhỏ dựng 1 Stage ẩn); ảnh chưa tải kịp → thử lại tối đa 5 lần.
- [x] C4 (Claude; S24+ 23/23: 3 trang, xuất 3 ảnh 0,9 s) Dải trang + thêm/nhân đôi/xóa/đổi thứ tự trang; EditorScreen theo trang đang mở; xuất nhiều trang; test.

## Đợt 3 — Kho mẫu (R2)
- [x] C5 (Claude; xem dieu-khoan-anh-chu-ai.md) Đọc điều khoản dùng ảnh Gemini / chữ ChatGPT cho mục đích thương mại → báo founder.
- [x] C6 (Claude; giao-viec-gemini.txt, giao-viec-gpt.txt) Bản giao việc cho Gemini (ảnh) và GPT (chữ mẫu).
- [ ] F1 (Founder) Tạo ảnh bằng Gemini, chữ bằng GPT theo bản giao việc; để vào thư mục Claude chỉ định trên laptop.
- [ ] C7 (Claude) Công cụ `tools/mau/` (JSON → .zunva + ảnh thu nhỏ) và 15 mẫu đầu.
- [ ] C8 (Claude) Tab Mẫu (lưới, lọc, tìm), trang chủ → mẫu theo loại, mở mẫu thành dự án mới; test.

## Đợt 4 — Hình nền điện thoại (R4)
- [x] K3 (Kiro) Prop `guides: 'phone-wallpaper'`: lớp gợi ý mờ, không chạm, không xuất.
  > Kiro: mới `guides.ts` (test trong `thumbnails.test.ts`); sửa `DesignCanvas.tsx` (prop + lớp Konva riêng `listening=false`, giữa trang và tay nắm). **Chưa chạy CI/máy.**
- [ ] C9 (Claude) `AndroidShell.screenSize`, loại "Hình nền điện thoại", cầu nối `AndroidWallpaper`, nút "Đặt làm hình nền"; 3 mẫu hình nền; test.

## Founder duyệt
- [x] Duyệt đặc tả G3 (founder duyệt 12/11).
