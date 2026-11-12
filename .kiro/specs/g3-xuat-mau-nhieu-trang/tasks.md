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
- [x] F1 (Founder) Tạo ảnh bằng Gemini, chữ bằng GPT theo bản giao việc; để vào thư mục Claude chỉ định trên laptop.
  > 12/11: đủ 15 ảnh + nhật ký nguồn gốc (`nguon-goc-anh-mau.txt`); chữ GPT 12 mẫu (`tools/mau/chu-mau.json`), mọi ô trong giới hạn.
- [x] C7 (Claude; S24+ 28/28: 15 ảnh thu nhỏ hiện sau 1,2 s, mở mẫu 0,4 s) 15 mẫu: mô tả `apps/web/src/mau/kho-mau.ts`, dựng/mở mẫu `dung-mau.ts`, ảnh JPEG ≈ 2 MB,
  ảnh thu nhỏ dựng bằng trình vẽ thật (`apps/web/scripts/anh-thu-nho-mau.mjs`, chạy trong CI). Khác thiết kế: xem design.md mục 6 "Đã làm".
- [x] C8 (Claude; S24+ 28/28) Tab Mẫu (lưới, lọc, tìm khớp đầu từ không dấu), trang chủ bấm loại → "Trang trắng" + mẫu; e2e `mau.spec.ts`; kịch bản điện thoại thêm 4 bước.

## Đợt 4 — Hình nền điện thoại (R4)
- [x] K3 (Kiro) Prop `guides: 'phone-wallpaper'`: lớp gợi ý mờ, không chạm, không xuất.
  > Kiro: mới `guides.ts` (test trong `thumbnails.test.ts`); sửa `DesignCanvas.tsx` (prop + lớp Konva riêng `listening=false`, giữa trang và tay nắm). **Chưa chạy CI/máy.**
- [x] C9 (Claude; S24+ 28/28: khổ đúng màn hình, có nút "Đặt làm hình nền"; đặt hình nền thật founder tự thử) `AndroidShell.screenSize`, loại "Hình nền điện thoại", cầu nối `AndroidWallpaper`, nút "Đặt làm hình nền"; 3 mẫu hình nền; test.

## Founder duyệt
- [x] Duyệt đặc tả G3 (founder duyệt 12/11).
