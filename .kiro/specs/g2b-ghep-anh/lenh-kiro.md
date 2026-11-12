# Lệnh cho Kiro — G2b ghép ảnh (K1–K6)

Đọc trước: `.kiro/specs/g2b-ghep-anh/requirements.md`, `design.md` (mục 2, 3), `tasks.md`.
Lõi dữ liệu v3 đã có sẵn (Claude làm, CI xanh): `BlendMode`, `BLEND_MODES`, `layer.blendMode`,
`ImageLayer.feather`, `ImageLayer.maskAssetId` trong `zunva/packages/core/src/model.ts`.

## Luật
- CHỈ sửa trong `zunva/packages/editor-canvas/`. Không thêm thư viện mới.
- Terminal của Kiro đang lỗi: KHÔNG chạy lệnh. Chỉ sửa file. Claude sẽ chạy CI.
- TypeScript strict + `exactOptionalPropertyTypes`. Giữ nguyên hành vi và test hiện có (cử chỉ F1–F7, hút góc, nền ô gõ, bỏ chữ rỗng).
- Không đổi prop cũ của `DesignCanvasProps`; chỉ thêm `brush` và `onMaskStroke` (đúng như design.md mục 3).

## Việc
- K1 `blendMode` mọi lớp → `globalCompositeOperation` ('normal' → 'source-over'). Ảnh xuất `exportPageImage` giống màn hình.
- K2 Lớp ảnh có `feather > 0` hoặc `maskAssetId`: vẽ qua canvas phụ (lật X/Y → mặt nạ `destination-in` → bo góc + `ctx.filter = blur(...)` `destination-in`), cạnh dài canvas phụ ≤ 2048, lưu đệm theo khóa. Mặt nạ nạp qua `assetUrl(maskAssetId)`. Thiếu `ctx.filter` thì bỏ mờ viền, vẫn vẽ ảnh.
- K3 Chế độ tẩy (`brush` khác null): 1 ngón tô erase/restore (cọ tròn, `size` px màn hình, `softness` 0..1 = mép cọ mềm, nối điểm thành nét liền), xem trước ngay mỗi khung hình; 2 ngón phóng/di chuyển trang; không chọn/kéo/xoay lớp; ẩn tay nắm. Nhấc ngón → PNG mặt nạ (cạnh dài ≤ 1024, tỉ lệ theo khung lớp) → `onMaskStroke(layerId, bytes)`.
- K4 Test Vitest cho hàm thuần (trong `geometry.ts` hoặc file mới `mask.ts`): điểm trang → điểm trong khung lớp (có xoay, lật), nội suy điểm giữa 2 lần chạm theo cỡ cọ, khóa lưu đệm, kích thước canvas mặt nạ.
- K5 README: cập nhật bảng hợp đồng (prop mới, nhãn hoàn tác).
- K6 (founder thử 12/11): lớp thấp (chữ 1 dòng) thì 2 nút ↻ góc trên/dưới dính nhau, che nút kéo dãn giữa cạnh. Khi cạnh lớp trên màn hình < 88 px: đẩy nút ↻ ra ngoài theo hướng chéo góc để các nút cách nhau ≥ 44 px; nút kéo dãn giữa cạnh vẫn bấm được.

Xong: đánh dấu [x] trong `tasks.md` (K1–K6), ghi ngắn file nào đã sửa, điều gì chưa chắc.
