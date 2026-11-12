# Tự kiểm tra Artio trên điện thoại thật (qua dây USB)

Bản lưu của công cụ đang chạy trên laptop founder (thư mục `kiem-tra-dien-thoai/` ở gốc repo, có `.gitignore` riêng).

Cần: APK **bản kiểm tra** (workflow "ZUNVA Android release APK", bật ô `ban_kiem_tra`), điện thoại bật Gỡ lỗi USB
(Samsung: tắt "Tự động chặn" trước), laptop có Node và `zunva/node_modules` (đã `pnpm install`).

Chạy: bấm đúp `chay-kiem-tra.bat`. Kết quả: `ket-qua/<thời điểm>/` gồm `bao-cao.md`, `ket-qua.json`, ảnh từng bước, `video.mp4`.
Chạm được gửi thẳng vào WebView (Chrome DevTools), không cài thêm gì lên điện thoại. Dự án thử tự xóa khi xong.
