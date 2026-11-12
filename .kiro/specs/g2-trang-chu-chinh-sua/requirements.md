# G2 — Trang chủ, màu giao diện và màn hình chỉnh sửa (Artio)

Ngày viết: 12/11/2026. Người viết: Claude. Trạng thái: **founder đã chốt màu (12/11/2026); chờ merge để bắt đầu**.

## Mục tiêu
Người lạ cầm điện thoại mở **Artio** là biết bấm đâu; chọn "Thiệp cưới" → vào màn hình chỉnh sửa → thêm chữ tiếng Việt, ảnh, hình → kéo, phóng to, xoay → hoàn tác được → thoát ra mở lại vẫn còn.

G2 **chưa** có: kho mẫu thiết kế sẵn, xuất PNG/PDF, AI, hình nền điện thoại (để G3).

## Quyết định đã có
- Tên thương hiệu: **Artio** (founder chốt 12/11/2026). Tên gói `vn.c87.lsc` giữ tới khi lên Google Play.
- Lõi vẽ: **Konva** (đạt G1-4: 66–72 FPS trên S24+).
- Học **bố cục** trang chủ từ video Canva founder quay 11/11; **không** dùng màu tím, logo, biểu tượng, mẫu của Canva.
- Màu: **hồng phấn** và **xanh nhạt**, người dùng **tự chuyển** được.

## Founder đã quyết (12/11/2026)
1. **Màu mặc định:** nền **xanh nhạt**, nút chính **hồng phấn**.
2. **Chế độ tối:** làm luôn trong G2.

## Yêu cầu

### R1 — Đổi tên thành Artio
- Tên hiện cho người dùng (`PRODUCT_NAME`), tên dưới biểu tượng Android, tiêu đề trang: **Artio**.
- Không đổi tên mã `@zunva/*`, định dạng `.zunva`, tên gói Android.

### R2 — Màu giao diện (chủ đề)
- 3 chủ đề: **Xanh nhạt** (mặc định: nền xanh nhạt, nút hồng phấn), **Hồng phấn**, **Tối**. Mỗi chủ đề là một bộ màu (nền, thẻ, chữ, nút chính, viền), đổi tức thì, không tải lại trang.
- Chữ luôn đủ đậm để đọc (tương phản ≥ 4.5:1 với nền).
- Nút đổi màu ở tab **Tài khoản** và một nút nhanh ở đầu trang chủ. Lựa chọn được nhớ trên máy.
- Chỉ đổi màu **giao diện app**, không đổi màu thiết kế của người dùng.

### R3 — Trang chủ
- Câu hỏi lớn "Bạn muốn tạo gì hôm nay?" + **ô tìm** (gõ "cưới", "bán hàng"… → gợi ý loại thiết kế; gõ không dấu cũng ra).
- **"Tiếp tục thiết kế"**: dự án sửa gần nhất (tối đa 10), có ảnh thu nhỏ; bấm là vào chỉnh sửa.
- **"Chọn cách bắt đầu"**: nút tròn nhiều màu theo **mục đích**: Thiệp cưới, Cáo phó, Bảng hiệu, Bài bán hàng, Mạng xã hội, Trang trắng (chọn khổ), Tải ảnh lên. Mỗi nút tạo dự án đúng khổ rồi mở chỉnh sửa.
- Ô xám khi đang tải; khổ 360px không cuộn ngang; mọi chữ tiếng Việt.

### R4 — Màn hình chỉnh sửa
- Vẽ trang thiết kế bằng Konva từ `DesignDocument` (lõi G1-3); mọi thay đổi đi qua **lệnh** (`Op`) để **hoàn tác/làm lại** được (giữ ≥ 200 bước).
- Thêm: **chữ**, **ảnh** (từ máy, lưu vào kho G1-5), **hình** (chữ nhật, tròn, đường).
- Chạm chọn; kéo; phóng to/thu nhỏ, xoay bằng tay nắm; chụm hai ngón để phóng trang; nút "Vừa màn hình".
- **Sửa chữ**: chạm hai lần → ô nhập; gõ Telex/VNI không lỗi dấu (như G1-4). Chỉnh phông, cỡ, màu, canh lề, đậm/nghiêng.
- Ảnh: thay ảnh, lật, bo góc, độ mờ. Hình: màu nền, viền.
- Lớp: đưa lên trên / xuống dưới, khóa, xóa, nhân đôi.
- Nền trang: màu hoặc ảnh.
- **Tự lưu** (G1-5 `createAutosave`); thoát ra mở lại đúng chỗ.
- Hiệu năng trên S24+: kéo ≥ 30 FPS với 30 lớp, khổ 1748×2480.

### R5 — Phông chữ tiếng Việt
- Ít nhất 6 phông có đủ dấu tiếng Việt, **giấy phép mở (OFL)**, đóng gói trong app (không cần mạng): gợi ý Be Vietnam Pro, Playfair Display, Dancing Script, Lora, Montserrat, Pacifico.

### R6 — Sửa điều founder thấy khi nghiệm thu G1
- Hộp hỏi xóa của riêng Artio (không còn dòng "Trang tại https://appassets…").
- "Mở file .zunva" dễ tìm hơn: hướng dẫn ngắn "file nằm trong Tải xuống/C87" (đổi thành Tải xuống/Artio).

## Nghiệm thu G2 (founder trên S24+)
1. Mở Artio: trang chủ đẹp, đổi được 3 màu, thoát mở lại vẫn nhớ màu.
2. Bấm "Thiệp cưới" → vào chỉnh sửa đúng khổ.
3. Thêm chữ "Trân trọng kính mời", đổi phông, màu; thêm ảnh từ máy; thêm hình tròn.
4. Kéo, phóng to, xoay; hoàn tác 5 lần rồi làm lại 5 lần đúng.
5. Tắt hẳn app, mở lại: "Tiếp tục thiết kế" có dự án, bấm vào thấy y như lúc thoát.
