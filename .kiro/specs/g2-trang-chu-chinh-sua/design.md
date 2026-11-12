# G2 — Thiết kế kỹ thuật

## Chia thư mục (để Claude và Kiro chạy song song, không đụng nhau)
| Thư mục | Người sửa | Nội dung |
| --- | --- | --- |
| `zunva/packages/editor-canvas/` (mới) | **Kiro** | Vẽ trang bằng react-konva, chọn/kéo/phóng/xoay, sửa chữ tại chỗ, phông chữ |
| `zunva/apps/web/` | **Claude** | Chủ đề màu, trang chủ, khung màn hình chỉnh sửa (thanh công cụ, bảng thuộc tính, lớp), lịch sử, tự lưu |
| `zunva/packages/core/`, `zunva/packages/platform/` | **Claude** | Chỉ sửa nhỏ nếu cần; Kiro cần thêm gì thì ghi vào báo cáo |
| `android/` | Claude (riêng R1: đổi nhãn thành Artio) | |
| `zunva/pnpm-lock.yaml` | Ai thêm thư viện thì cập nhật; tránh hai bên cùng thêm một lúc | |

## Hợp đồng `@zunva/editor-canvas` (Kiro làm, Claude dùng)
```ts
import type { DesignDocument, Id, Op } from '@zunva/core';

export interface DesignCanvasProps {
  document: DesignDocument;
  pageId: Id;
  selection: readonly Id[];                  // lớp đang chọn
  onSelect(ids: Id[]): void;                 // chạm vào lớp / chạm chỗ trống = []
  /** Mọi thay đổi do thao tác trên trang. mergeKey: gộp các bước kéo liên tục thành 1 bước hoàn tác. */
  onOps(label: string, ops: Op[], mergeKey?: string): void;
  /** Kéo xong / thả tay: báo để khép bước gộp (history.closeMerge). */
  onGestureEnd(): void;
  /** URL (blob:) của ảnh trong kho; undefined = đang tải → vẽ ô xám. */
  assetUrl(assetId: Id): string | undefined;
  /** Đang sửa chữ lớp nào (để khung ngoài ẩn thanh công cụ). */
  onTextEditing?(layerId: Id | null): void;
  readonly?: boolean;
}

export interface DesignCanvasHandle {
  fitToScreen(): void;
  /** Dùng cho G3 (xuất PNG) — xuất đúng khung trang, không theo màn hình. */
  exportPageImage(pixelRatio: number): Promise<Blob>;
}

export function DesignCanvas(props: DesignCanvasProps & { ref?: React.Ref<DesignCanvasHandle> }): JSX.Element;
export const FONT_FAMILIES: readonly { id: string; label: string }[];
export function fontsReady(): Promise<void>;
```
- Canvas **không tự giữ** tài liệu: chỉ vẽ `document` nhận vào và phát `Op` (`updateLayer` với `set: { x, y, width, height, rotation, text … }`). Khung ngoài (Claude) chạy `execute()` của lõi, nên hoàn tác/làm lại nằm một chỗ.
- Kéo/xoay/phóng: phát `updateLayer` liên tục với cùng `mergeKey` (ví dụ `drag:<layerId>`), thả tay gọi `onGestureEnd()`.
- Sửa chữ: ô nhập HTML phủ lên đúng vị trí (như G1-4, đã đạt Telex); Enter xuống dòng; chạm ra ngoài = xong → 1 `updateLayer { text }`.
- Bài học G1-4 phải làm đúng: không dựng lại cảnh khi đổi khổ; xuất ảnh theo khung trang; nút "Xong" không bị che.

## Phía Claude (`apps/web`)
- **Chủ đề màu:** biến CSS trên `:root[data-theme="xanh|hong|toi"]`; lựa chọn lưu `localStorage` (bọc try/catch), mặc định theo quyết định founder.
- **Điều hướng:** trang chủ → chỉnh sửa (`?project=<id>`), nút quay lại; Android nút Back quay về trang chủ.
- **Lịch sử:** `createHistory` / `execute` / `undo` / `redo` / `closeMerge` của lõi; nút ↶ ↷.
- **Tự lưu:** `createAutosave(store)` mỗi khi `history.doc` đổi; lưu ngay khi trang ẩn.
- **Ảnh:** `platform.images.pickImage()` → `store.putAsset` → `addAsset` + `addLayer`; URL blob tạo từ kho, thu hồi khi rời màn hình.
- **Ảnh thu nhỏ** cho "Tiếp tục thiết kế": dùng `exportPageImage(0.2)` khi rời màn hình chỉnh sửa, lưu vào kho (khóa `thumb_<projectId>`).
- **Hộp hỏi** riêng thay `window.confirm`.
