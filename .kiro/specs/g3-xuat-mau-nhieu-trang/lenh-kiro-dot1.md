# Lệnh cho Kiro — G3 đợt 1 (K1: vẽ trang bất kỳ ra ảnh)

Đọc trước: `.kiro/specs/g3-xuat-mau-nhieu-trang/requirements.md` (R1), `design.md` (mục 1), `tasks.md`.

## Luật (như G2b)
- CHỈ sửa trong `zunva/packages/editor-canvas/`. Không thêm thư viện mới.
- Terminal Kiro đang lỗi: KHÔNG chạy lệnh, chỉ sửa file. Claude chạy CI.
- TypeScript strict + `exactOptionalPropertyTypes`. Giữ nguyên hành vi, prop và test hiện có (cử chỉ, tẩy, hòa trộn, mờ viền, nút ↻).

## K1
Xuất từ `index.ts`:
```ts
export function renderPageImage(
  doc: DesignDocument,
  pageId: Id,
  opts: { pixelRatio: number; mimeType: 'image/png' | 'image/jpeg'; quality?: number; assetUrl(id: Id): string | undefined },
): Promise<Blob>;
```
- Ảnh ra **giống y màn hình**: nền (màu + ảnh nền + độ rõ), chữ (phông, đậm/nghiêng, canh lề, giãn dòng), ảnh (cắt, lật, bo góc, mặt nạ tẩy, mờ viền), hình, độ rõ, ẩn, **hòa trộn**. Không có tay nắm, khung chọn, nút ↻.
- Dùng **chung mã dựng** với `DesignCanvas` để không lệch nhau. Gợi ý: tách phần vẽ nền + các lớp (chế độ chỉ xem) thành một component dùng chung, rồi `renderPageImage` dựng component đó vào một Stage ẩn (react-dom `createRoot` trên một `div` không gắn vào trang, hoặc cách khác bạn thấy chắc hơn). Dọn sạch Stage/root sau khi vẽ.
- Chờ `fontsReady()` và mọi ảnh + mặt nạ của trang tải xong (có hết giờ 20 giây → lỗi tiếng Việt).
- Kích thước ra = khổ trang × `pixelRatio`, làm tròn; cạnh dài > 16384 → `RangeError` tiếng Việt (giữ `MAX_EXPORT_SIDE`).
- JPG: tô nền trắng dưới cùng (JPG không có trong suốt). PNG: trang không có màu nền đục thì giữ trong suốt.
- `DesignCanvasHandle.exportPageImage(pixelRatio)` gọi lại `renderPageImage` cho trang đang mở (giữ hợp đồng cũ, app đang dùng cho ảnh thu nhỏ).
- Test Vitest cho hàm thuần (kích thước ra, giới hạn, chọn màu nền cho JPG…). README: thêm mục `renderPageImage`.

Xong: đánh dấu [x] K1 trong `tasks.md`, ghi ngắn file đã sửa và điều chưa chắc.
