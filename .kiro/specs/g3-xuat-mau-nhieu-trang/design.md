# G3 — Thiết kế

## 1. Vẽ một trang bất kỳ ra ảnh (`@zunva/editor-canvas`, Kiro)
Hiện `DesignCanvasHandle.exportPageImage` chỉ vẽ trang đang mở. G3 cần vẽ mọi trang (xuất nhiều trang, PDF, ảnh thu nhỏ dải trang, ảnh thu nhỏ mẫu).

```ts
/** Vẽ một trang ra ảnh mà không cần màn hình chỉnh sửa (Konva stage ẩn, dùng chung cách vẽ với DesignCanvas). */
export function renderPageImage(
  doc: DesignDocument,
  pageId: Id,
  opts: { pixelRatio: number; mimeType: 'image/png' | 'image/jpeg'; quality?: number; assetUrl(id: Id): string | undefined },
): Promise<Blob>;
```
- Tách phần "dựng node Konva từ lớp" ra file dùng chung (chữ, ảnh + mặt nạ/mờ viền, hình, nền, hòa trộn) để màn hình và ảnh xuất **cùng một mã** → giống nhau.
- Chờ phông (`fontsReady`) và mọi ảnh/mặt nạ tải xong trước khi vẽ. Cạnh dài ≤ 16384 px (giữ `MAX_EXPORT_SIDE`).
- JPG: tô nền trắng dưới cùng nếu trang không có màu nền đục.
- `exportPageImage` của handle gọi lại `renderPageImage` cho trang đang mở (giữ hợp đồng cũ).
- Lớp gợi ý hình nền (mục 5) **không** được vẽ khi xuất.

## 2. PDF (`@zunva/core`, Claude)
```ts
/** PDF tối thiểu, không thư viện ngoài: mỗi trang là một ảnh JPEG phủ kín trang. */
export function buildPdf(pages: Array<{ jpeg: Uint8Array; widthPx: number; heightPx: number }>, dpi: number, meta: { title: string; createdAt: number }): Uint8Array;
```
- Khổ trang PDF (điểm) = px ÷ dpi × 72. Ảnh nhúng `/DCTDecode`. Tiêu đề, ngày tạo, tác giả "Artio".
- Ảnh trang vẽ ở đúng px của trang (DPI thiết kế, mặc định 300) → in sắc nét. Giới hạn tổng 100 MB (cầu nối Android).
- Test: cấu trúc PDF hợp lệ (xref, trailer, số trang, MediaBox đúng mm), đọc lại bằng trình phân tích tối thiểu trong test.

## 3. Lõi khác (Claude)
- Op mới `movePage { pageId, toIndex }` (+ nghịch đảo), test.
- `cloneDocumentForTemplate(doc, newId, now)`: bản sao với ID mới cho tài liệu, trang, lớp (tài nguyên giữ ID vì ảnh mẫu dùng chung), `meta.templateId` = ID mẫu.

## 4. App (Claude)
- **Bảng Xuất** (`ExportSheet.tsx`): định dạng, chất lượng, trang (tất cả / trang đang mở), nút Xuất; tiến độ; kết quả + nút Chia sẻ.
  Lưu qua `platform.gallery.saveImage` (ảnh) / `platform.files.saveBytes` (PDF).
- **Chia sẻ (Android):** cầu nối mới `AndroidShare.share(uri, mimeType)` — `saveBytes`/`saveImage` trả thêm `uri` (content:// của MediaStore), Java mở `Intent.ACTION_SEND` + `createChooser`. Web: `navigator.share` nếu có, không thì ẩn nút.
- **Dải trang** (`PageStrip.tsx`) dưới vùng vẽ: ảnh thu nhỏ (từ `renderPageImage`, pixelRatio nhỏ, làm lại khi trang đổi, tối đa 1 lần/giây), nút thêm/nhân đôi/xóa/lên/xuống.
  `EditorScreen` giữ `pageId` đang mở (hiện luôn là trang đầu).
- **Ảnh thu nhỏ dự án** (trang chủ) vẫn là trang 1.

## 5. Hình nền điện thoại
- Cầu nối `AndroidShell.screenSize()` → `{"width":1080,"height":2340}` (px thật, `WindowMetrics`). App dùng làm khổ; web: 1080×2340.
- `meta.kind = 'wallpaper'` → DesignCanvas nhận prop mới `guides: 'phone-wallpaper' | null` (Kiro): vẽ lớp mờ (không chạm được, không xuất) chỉ vùng đồng hồ màn hình khóa (khoảng 12–30% chiều cao từ trên) và hàng biểu tượng dưới (khoảng 85–100%).
- Cầu nối `AndroidWallpaper.setWallpaper(requestId, base64Png, target)` (`home` | `lock` | `both`), `WallpaperManager.setBitmap(..., flags)`; quyền `SET_WALLPAPER` (quyền thường, không hỏi người dùng). Trả lời bất đồng bộ như tách nền.

## 6. Kho mẫu
### Định dạng
- `zunva/apps/web/public/mau/index.json`:
  `[{ id, kind, title, tags: string[], width, height, file: "<id>.zunva", thumb: "<id>.webp", order }]`
- Mỗi mẫu là một file `.zunva` thường (đã có bộ đọc/ghi, kiểm tra hợp lệ). Ảnh thu nhỏ WebP 360 px.
- Mở mẫu: `fetch` file → `unpackZunva` → `cloneDocumentForTemplate` → `putAsset` từng ảnh (ID ảnh mẫu cố định, có rồi thì bỏ qua) → `store.save` → mở.

### Làm mẫu (Claude)
- Công cụ `tools/mau/`: mỗi mẫu viết bằng một file mô tả JSON ngắn (khổ, nền, các lớp chữ/ảnh/hình, phông, màu) → script dựng `.zunva` (dùng `@zunva/core`) + ảnh thu nhỏ (dựng bằng Playwright + `renderPageImage` trong CI). Chạy lại được, sửa mẫu = sửa JSON.
- Ảnh minh họa: founder tạo bằng **Gemini** theo bản giao việc Claude soạn (`.kiro/specs/g3-xuat-mau-nhieu-trang/giao-viec-gemini.md`), lưu vào laptop; Claude nén (WebP/JPEG ≤ 400 KB/ảnh) và gắn vào mẫu.
- Chữ mẫu: **GPT** viết theo bản giao việc (`giao-viec-gpt.md`): giọng, độ dài từng dòng, ví dụ; Claude kiểm chính tả, độ dài vừa khung.
- Trước khi đưa ảnh/chữ AI vào app: Claude đọc điều khoản dùng nội dung tạo ra (Gemini, ChatGPT) cho mục đích thương mại, báo founder.
- Phông: chỉ 6 phông OFL đang có. Màu: bảng màu riêng của Artio.

### Đã làm (C7, 12/11) — khác bản thiết kế ở trên
- Mẫu viết bằng **mô tả TypeScript** `apps/web/src/mau/kho-mau.ts` (có kiểm kiểu, unit test) thay cho JSON + file `.zunva` riêng:
  mở mẫu = dựng tài liệu từ mô tả (`buildTemplateDocument`) → `cloneDocumentForTemplate` → lưu. Không lưu ảnh hai lần trong APK.
- Ảnh minh họa: `public/mau/anh/<id>.jpg` (JPEG chất lượng 92, tổng ≈ 2 MB). Nguồn gốc: `nguon-goc-anh-mau.txt`.
- Ảnh thu nhỏ: `public/mau/thu-nho/<id>.webp`, dựng bằng `apps/web/scripts/anh-thu-nho-mau.mjs` (Vite dev + Playwright + `renderPageImage`, phông thật).
  CI chạy và tải lên artifact `anh-thu-nho-mau`; Claude xem rồi commit. Chưa có ảnh thu nhỏ thì lưới hiện ảnh minh họa gốc.
- Bảng hiệu 3000×1000: ảnh 16:9 là một lớp bên phải, nền trang cùng màu với mép trái ảnh. Mẫu khác: ảnh làm nền trang (chạm chữ không kéo nhầm ảnh).
- Hình nền: mẫu chỉ có ảnh → khi mở đổi khổ theo màn hình máy (Android), ảnh tự phủ lại.
- Trang chủ: bấm loại có mẫu → bảng "Trang trắng" + các mẫu của loại đó.

## 7. Rủi ro
- Xuất nhiều trang khổ lớn trên điện thoại yếu: vẽ từng trang, giải phóng canvas ngay; PDF A4 nhiều trang có thể > 100 MB → báo trước và đề nghị chất lượng Thường.
- Mẫu làm tăng dung lượng app: giới hạn tổng kho mẫu đợt đầu ≤ 15 MB.
- Đặt hình nền màn hình khóa trên một số máy Samsung có thể bị hệ thống bỏ qua → báo đúng kết quả Java trả về.
