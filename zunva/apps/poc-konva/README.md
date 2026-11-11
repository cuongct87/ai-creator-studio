# @zunva/poc-konva — Thử lõi vẽ Konva (G1-4)

Bản thử **độc lập**, dùng một lần để quyết định có chọn Konva làm lõi vẽ hay không. Không phải sản phẩm, không import `@zunva/core`.

## Có gì để thử

| Bước spec | Thử ở đâu |
| --- | --- |
| 4.1 | Trang 1080×1350, nút "Khổ" đổi sang 1748×2480. 30 vật: 10 khối chữ tiếng Việt nhiều dòng, 18 hình, 2 ảnh lớn tự tạo bằng canvas (3200×2400 và 3000×3000). |
| 4.2 | Phông Be Vietnam Pro và Playfair Display đi kèm app (OFL 1.1, gói `@fontsource`). App chờ phông tải xong mới vẽ. |
| 4.3 | Chạm để chọn; kéo; xoay và đổi cỡ bằng khung `Transformer`; chụm hai ngón để phóng to/thu nhỏ; kéo chỗ trống để di chuyển trang. |
| 4.4 | Chạm hai lần vào chữ → ô gõ hiện đúng chỗ; gõ xong bấm "Xong" hoặc chạm ra ngoài. |
| 4.5 | Chọn ảnh → "Cắt ảnh" → kéo khung → "Áp dụng cắt". "Chọn nhiều" → chạm 2 vật → "Nhóm" / "Bỏ nhóm". Hoàn tác / Làm lại (bản thử chụp cả trang). |
| 4.6 | Thanh FPS: FPS hiện tại, FPS thấp nhất và trung bình **khi đang kéo/xoay/chụm**. "Xuất PNG" tải ảnh đúng khổ trang. |

## Chạy trên laptop và mở trên điện thoại (4.7)

```
cd zunva
pnpm install
pnpm --filter @zunva/poc-konva dev --host
```

Vite in ra dòng `Network: http://<IP-laptop>:5174/`. Trên điện thoại (cùng Wi-Fi) mở đúng địa chỉ đó bằng Chrome. Nếu Windows hỏi tường lửa, chọn **Mạng riêng (Private)**.

## Giấy phép

- `konva`, `react-konva`: MIT.
- Be Vietnam Pro, Playfair Display: SIL Open Font License 1.1 (qua `@fontsource`).
- Ảnh thử do mã tự vẽ, không dùng ảnh có bản quyền.
