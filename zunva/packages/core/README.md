# @zunva/core

Lõi dữ liệu thiết kế (định dạng v2). Không phụ thuộc React, DOM hay thư viện vẽ; không có thư viện ngoài.

| File | Vai trò |
| --- | --- |
| `model.ts` | Kiểu dữ liệu: Tài liệu → Trang → Lớp (chữ, ảnh, hình) và Tài nguyên. Có sẵn `timing`/`animation`/`duration` (để `null`) cho video sau 1.0. |
| `factory.ts` | Tạo phần tử với giá trị mặc định hợp lệ. ID và thời điểm truyền từ ngoài vào. |
| `ids.ts` | Sinh ID; nguồn ngẫu nhiên có hạt giống cho test. |
| `validate.ts` | Kiểm tra dữ liệu khi mở file/nhập/nhận kết quả AI; trả về mọi lỗi kèm đường dẫn. |
| `ops.ts` | Thao tác nhỏ nhất, có đảo ngược: thêm/xóa/sửa/sắp lớp, trang, tài nguyên, đổi tên. |
| `history.ts` | Hoàn tác/làm lại theo thao tác (không chụp cả thiết kế); gộp thao tác liên tục bằng `mergeKey`. |

Mọi hàm đều thuần: nhận trạng thái cũ, trả trạng thái mới, không sửa dữ liệu cũ.
