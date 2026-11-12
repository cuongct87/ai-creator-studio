# G2b — Thiết kế

## 1. Dữ liệu: schema v3 (`@zunva/core`)
```ts
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'
  | 'darken' | 'lighten' | 'difference' | 'color' | 'luminosity';

interface LayerBase { ...; blendMode: BlendMode }          // mặc định 'normal'
interface ImageLayer extends LayerBase {
  ...;
  /** Mờ viền, px của trang. 0 = không. */
  feather: number;
  /** Ảnh mặt nạ PNG phủ đúng khung lớp (hướng ảnh gốc). Mức giữ = độ sáng × độ đục: trắng đục = giữ; đen/trong suốt = đã tẩy. null = không tẩy. */
  maskAssetId: Id | null;
}
```
- `SCHEMA_VERSION = 3`. Hàm `migrateDocument(raw)` nâng v2 → v3 (thêm `blendMode: 'normal'`, `feather: 0`, `maskAssetId: null`).
  Gọi ở `ProjectStore.load` và `unpackZunva` (manifest schemaVersion 2 hoặc 3 đều nhận).
- Kiểm tra (validate): `blendMode` thuộc danh sách; `feather` ≥ 0; `maskAssetId` null hoặc trỏ tới asset ảnh có trong tài liệu.
- Mặt nạ phủ theo **khung lớp**, không theo ảnh gốc: kéo dãn lớp thì mặt nạ dãn theo. Cạnh dài mặt nạ ≤ 1024 px (đủ mịn trên điện thoại, file nhỏ).
- "Thay ảnh" giữ mặt nạ (người dùng có thể "Bỏ hết vùng tẩy").

## 2. Vẽ (`@zunva/editor-canvas`, Kiro)
- `blendMode` → `globalCompositeOperation` của node Konva (mọi loại lớp); `'normal'` → `'source-over'`. Ảnh xuất (`exportPageImage`) dùng cùng cây node nên giống màn hình.
- Lớp ảnh có `feather > 0` hoặc `maskAssetId` → vẽ qua một canvas phụ rồi đưa vào `Konva.Image`:
  1. vẽ ảnh (lật X/Y) đúng kích thước lớp (giới hạn cạnh dài canvas phụ 2048 px, tỉ lệ theo lớp);
  2. `destination-in` với mặt nạ (nếu có), co giãn vừa khung;
  3. `destination-in` với hình chữ nhật bo góc `cornerRadius`, tô bằng `ctx.filter = blur(feather)` (mép tan dần);
  Lưu đệm theo khóa (assetId, maskAssetId, width, height, cornerRadius, feather, flipX, flipY, kích thước canvas phụ). Không có feather/mặt nạ thì giữ cách vẽ hiện tại.
- Mặt nạ được nạp như ảnh thường qua `assetUrl(maskAssetId)`.

## 3. Chế độ tẩy (editor-canvas, Kiro)
Thêm vào `DesignCanvasProps` (không đổi các prop cũ):
```ts
brush?: { layerId: Id; mode: 'erase' | 'restore'; size: number /* px màn hình */; softness: number /* 0..1 */ } | null;
/** Một nét tẩy xong: PNG mặt nạ mới của lớp. App lưu asset rồi đặt maskAssetId (1 bước hoàn tác). */
onMaskStroke?(layerId: Id, png: Uint8Array): void;
```
- Khi `brush` khác null: không chọn/kéo/xoay lớp; 1 ngón tô; 2 ngón phóng/di chuyển trang như cũ. Ẩn tay nắm.
- Trong lúc tô: vẽ thẳng vào canvas mặt nạ đang làm việc (bắt đầu từ mặt nạ hiện có, hoặc trắng toàn bộ), cập nhật hình ngay mỗi khung hình.
  Tọa độ ngón → tọa độ trong khung lớp (tính cả xoay, lật). `erase`: tô với `destination-out` (làm trong suốt); `restore`: tô đục (`source-over`, màu trắng). Cọ tròn, `softness` = gradient mép cọ. Nối các điểm thành nét liền (không lỗ khi kéo nhanh).
- Nhấc ngón → `canvas.toBlob('image/png')` → `onMaskStroke`.
- Hàm thuần có test: đổi tọa độ trang → khung lớp (xoay, lật); nội suy điểm giữa hai lần chạm; khóa lưu đệm.

## 4. App (Claude)
- Bảng thuộc tính: "Hòa trộn" (danh sách 10 kiểu), với ảnh thêm "Mờ viền", "Tẩy", "Tách nền", "Bỏ hết vùng tẩy".
- Chế độ tẩy: thanh công cụ riêng dưới trang — Tẩy | Khôi phục, Cỡ cọ, Độ mềm, Xong. Hoàn tác/làm lại vẫn dùng được.
- `onMaskStroke`: `putAsset` → op `addAsset` + `updateLayer {maskAssetId}` trong 1 bước.
- Dọn tài nguyên: khi mở dự án, xóa ảnh trong kho không còn được tài liệu dùng (mỗi nét tẩy tạo 1 ảnh mặt nạ; lịch sử hoàn tác chỉ nằm trong bộ nhớ nên lúc mở dự án dọn là an toàn).

## 5. Tách nền (Claude)
- `Platform.images.segmentSubject(bytes, mimeType): Promise<Result<Uint8Array /* PNG mặt nạ */ | null>>`; nền tảng không có → hàm vắng mặt, app ẩn nút.
- **Android:** ML Kit Subject Segmentation (Google), chạy trên máy, mô hình tải qua Google Play services, app nặng thêm ~200 KB, minSdk 24.
  Đang ở bản **beta** (không cam kết lâu dài) — chấp nhận cho 1.0, giữ đường lui là cục tẩy tay.
  Cầu nối Java: nhận ảnh, trả mặt nạ PNG alpha (độ tin cậy cao → đục, thấp → trong suốt, mép chuyển mềm), thu về cạnh dài ≤ 1024, xoay theo EXIF như trình duyệt hiển thị.
  Tải mô hình lúc cài (`meta-data` trong manifest) để lần đầu không phải chờ.
- **iOS (G5):** Vision `VNGenerateForegroundInstanceMaskRequest` (iOS 17+). **Web:** để sau (có thể MediaPipe, chỉ tách người).
- Cần kiểm trước khi làm: điều khoản ML Kit (miễn phí, không giới hạn lượt?) — Claude đọc điều khoản, báo founder.

## 6. Rủi ro
- Máy yếu: canvas phụ 2048 px × nhiều ảnh → tốn bộ nhớ. Giới hạn kích thước + chỉ dựng lại khi khóa đổi.
- `ctx.filter` (blur) có trên WebView Chrome; nếu vắng thì bỏ qua mờ viền (vẫn vẽ ảnh) — kiểm trên S24+.
- ML Kit beta có thể đổi API; mặt nạ là PNG chung nên đổi nguồn tách nền không ảnh hưởng dữ liệu.
