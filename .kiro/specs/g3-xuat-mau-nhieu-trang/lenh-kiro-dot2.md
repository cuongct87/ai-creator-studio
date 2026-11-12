# Lệnh cho Kiro — G3 đợt 2 (K2 ảnh thu nhỏ trang) + đợt 4 (K3 vạch gợi ý hình nền)

Đọc trước: `.kiro/specs/g3-xuat-mau-nhieu-trang/requirements.md` (R3, R4), `design.md` (mục 1, 4, 5), `tasks.md`.

## Đã đổi từ lần trước (Claude, đã chạy trên S24+ 20/20) — giữ nguyên, đừng hoàn tác
- `composite.ts`: `encodeCanvas()` dùng `toDataURL`. **Không dùng `canvas.toBlob` hay `OffscreenCanvas.convertToBlob`**:
  WebView chỉ mã hóa khi máy rảnh → chờ 3–13 giây (đo trên S24+). Mọi chỗ cần ảnh từ canvas phải gọi `encodeCanvas`.
- `perf.ts`: `perfMark(label)` — đồng hồ đo cho kịch bản kiểm tra (chỉ ghi khi có `window.__artioMarks`). Giữ các chỗ đang gọi.

## Luật (như các đợt trước)
- CHỈ sửa trong `zunva/packages/editor-canvas/`. Không thêm thư viện mới. KHÔNG chạy lệnh terminal. Claude chạy CI.
- TypeScript strict + `exactOptionalPropertyTypes`. Giữ hành vi, prop và test hiện có.

## K2 — Ảnh thu nhỏ trang (cho dải trang)
Xuất từ `index.ts`:
```ts
/** Ảnh thu nhỏ của mọi trang (blob: URL), làm lại khi trang đổi. */
export function usePageThumbnails(doc: DesignDocument, assetUrl: (id: Id) => string | undefined, maxSide?: number /* mặc định 160 */): Record<Id, string>;
```
- Dùng `renderPageImage` (PNG, `pixelRatio = maxSide / cạnh dài trang`).
- Chỉ làm lại trang **đã đổi**: lõi luôn tạo object trang mới khi trang đổi (bất biến) → lưu đệm theo object trang (WeakMap) hoặc so sánh tham chiếu.
- Tối đa 1 lần vẽ mỗi giây cho mỗi trang (đang kéo/tẩy liên tục thì gom lại), vẽ lần lượt từng trang (không song song).
- Thu hồi URL cũ (`URL.revokeObjectURL`) khi thay và khi unmount; trang bị xóa thì bỏ ảnh của nó.
- Test hàm thuần (chọn trang cần vẽ lại, tính pixelRatio).

## K3 — Vạch gợi ý hình nền điện thoại
- Prop mới của `DesignCanvas`: `guides?: 'phone-wallpaper' | null`.
- Vẽ lớp mờ **trên cùng**, không chạm được (`listening: false`), **không có trong ảnh xuất** (`renderPageImage` không vẽ):
  - vùng đồng hồ màn hình khóa: từ 12% đến 30% chiều cao trang, toàn bề ngang;
  - hàng biểu tượng dưới: từ 86% đến 100% chiều cao trang;
  - nền trắng độ đục 0,18, viền nét đứt màu nhấn, chữ nhỏ "Đồng hồ" / "Biểu tượng" (cỡ chữ ~2,2% chiều cao trang).
- Không che tay nắm / nút ↻, không ảnh hưởng chế độ tẩy và chạm chọn lớp (lớp gợi ý không nhận chạm).
- Hàm thuần tính các vùng (`wallpaperGuideRects(page)`) + test. README: thêm `usePageThumbnails`, `guides`.

Xong: đánh dấu [x] K2, K3 trong `tasks.md`, ghi ngắn file đã sửa và điều chưa chắc.
