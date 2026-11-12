# Tự kiểm tra Artio bản Windows (G4)

Bản lưu của công cụ chạy trên laptop founder (thư mục `kiem-tra-windows/` ở gốc repo trên laptop, có `.gitignore` riêng).

Cần: cài **bản kiểm tra** (artifact `artio-windows-ban-kiem-tra` của workflow "Artio Windows installer"),
laptop có Node và `zunva/node_modules` (đã `pnpm install`, dùng chung với kịch bản điện thoại).

Chạy: bấm đúp `chay-kiem-tra-windows.bat`. Kịch bản tự mở Artio, nối vào cửa sổ app qua cổng 9333 (chỉ trên máy),
bấm bằng chuột/bàn phím thật, kiểm file trong `Ảnh\Artio` và `Tải xuống\Artio`, tắt mở lại app để kiểm dự án còn nguyên.
Kết quả: `ket-qua/<thời điểm>/` gồm `bao-cao.md`, `ket-qua.json`, ảnh từng bước. Dự án thử và file thử tự xóa khi xong.
