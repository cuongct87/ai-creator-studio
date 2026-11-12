# G2b — Ghép ảnh chồng lớp (kiểu PicsArt)

Nguồn: founder thử APK 12/11/2026 (video 2), chồng nhiều ảnh lên nhau nhưng "không như PicsArt".
Founder chọn cả 4 công cụ: kiểu hòa trộn, làm mờ viền, cục tẩy, tự tách nền.

Hiện có: độ rõ (opacity), bo góc. Thiếu: ảnh trên hòa vào ảnh dưới, mép tan dần, tẩy từng phần, cắt người ra khỏi nền.

## R1 Kiểu hòa trộn (mọi lớp: ảnh, chữ, hình)
- Bảng thuộc tính có mục "Hòa trộn" với 10 kiểu: Thường, Nhân (tối), Sáng (screen), Phủ (overlay),
  Ánh mềm (soft-light), Tối hơn, Sáng hơn, Khác biệt, Màu, Độ sáng.
- Đổi kiểu thấy ngay trên trang; ảnh xuất (thu nhỏ, sau này PNG/PDF) giống y trên màn hình.
- Mỗi lần đổi = 1 bước hoàn tác.

## R2 Làm mờ viền (lớp ảnh)
- Thanh trượt "Mờ viền" 0 → 50% cạnh ngắn của ảnh. 0 = mép sắc như hiện tại.
- Mép tan dần vào lớp bên dưới, đi cùng bo góc (bo góc + mờ viền = khung tròn mềm).
- Kéo thanh trượt = 1 bước hoàn tác.

## R3 Cục tẩy (lớp ảnh)
- Nút "Tẩy" trong bảng ảnh → vào chế độ tẩy cho đúng ảnh đó: 1 ngón tô lên ảnh để xóa phần đó, lộ lớp dưới.
- Có "Khôi phục" (tô để lấy lại phần đã tẩy), cỡ cọ (thanh trượt), độ mềm của cọ.
- Hai ngón trong chế độ tẩy vẫn phóng/di chuyển trang để tẩy chỗ nhỏ.
- Mỗi nét tẩy (đặt ngón → nhấc ngón) = 1 bước hoàn tác.
- Nút "Xong" thoát chế độ tẩy; nút "Bỏ hết vùng tẩy" trả ảnh về nguyên vẹn (1 bước hoàn tác).
- Tẩy không làm hỏng ảnh gốc: ảnh gốc giữ nguyên, phần tẩy lưu riêng.

## R4 Tự tách nền (lớp ảnh)
- Nút "Tách nền": máy tự nhận ra người/vật chính và ẩn phần nền. Kết quả là vùng tẩy → sửa tiếp bằng cục tẩy/khôi phục được.
- Chạy ngay trên điện thoại, không gửi ảnh ra ngoài, không tốn phí.
- Đang chạy hiện "Đang tách nền…"; lỗi/không thấy chủ thể thì báo câu dễ hiểu, ảnh giữ nguyên.
- Nền tảng chưa hỗ trợ (web lúc đầu) thì ẩn nút.

## R5 Dữ liệu
- Dự án đã lưu trước G2b mở ra vẫn y nguyên (tự nâng cấp dữ liệu, không mất gì).
- File .zunva cũ (schemaVersion 2) vẫn mở được.

## Ngoài phạm vi G2b
Tẩy trên chữ/hình, mặt nạ theo hình (ảnh lồng trong chữ), bộ lọc màu ảnh, cắt ảnh (crop) — để G3+.
