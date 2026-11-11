# @zunva/tools

Mỗi công cụ ZUNVA (chữ, ảnh, hình, nền, AI...) là một mô-đun tự khai báo:

- tên và biểu tượng;
- dùng cho loại lớp nào (chữ, ảnh, hình, trang);
- hiện ở chế độ Phổ thông, Chuyên nghiệp hay cả hai;
- cần quyền gì (mạng, AI, ảnh, có tốn phí không);
- bảng điều khiển của nó.

Thêm công cụ = thêm một mô-đun ở đây, không sửa `@zunva/core`.
Công cụ không bao giờ đọc khóa API; mọi lệnh gọi AI đi qua một dịch vụ AI chung.

Hợp đồng chi tiết (`ToolManifest`) được viết ở G1-3. Công cụ chưa xong thì ẩn hẳn, không hiện nút.
