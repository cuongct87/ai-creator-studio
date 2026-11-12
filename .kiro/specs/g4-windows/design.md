# G4 — Thiết kế bản Windows

Ghi rõ: **[đã kiểm]** = đã thấy trong mã/tài liệu; **[giả thuyết]** = phải thử khi dựng, có phương án dự phòng.

## 1. Chọn vỏ: Tauri 2
- Tauri 2 (bản CLI mới nhất 2.11.0, 30/4/2026 [đã kiểm]) dùng WebView2 có sẵn trên Windows 10/11 → bản cài nhỏ (vài MB + mã web).
  Electron nặng khoảng 80–100 MB vì kèm cả trình duyệt → không chọn.
- `zunva/README.md` và `packages/platform` đã dự tính vỏ Tauri từ G1 [đã kiểm]; `vite.config.ts` dùng `base: './'` nên chạy được trong Tauri.
- Thư mục mới `zunva/apps/desktop/` (gói `@zunva/desktop`): chỉ chứa `src-tauri/` (Rust, cấu hình, biểu tượng). Giao diện lấy từ `apps/web/dist`.
- Mã định danh `vn.c87.lsc` (giống Android). Tên "Artio". Phiên bản theo Android (`versionName`).
- Địa chỉ trang trong app: `http://tauri.localhost` (mặc định của Tauri trên Windows). **Không đổi về sau**: đổi địa chỉ = mất dự án đã lưu (IndexedDB theo địa chỉ).

## 2. Phần Rust (ít nhất có thể)
Hai lệnh riêng của Artio + plugin chính thức `opener` (mở Explorer chọn sẵn file):
```rust
/// Ghi byte vào Pictures\Artio hoặc Downloads\Artio; trùng tên thêm " (2)"…; trả đường dẫn đầy đủ.
#[tauri::command] fn save_file(request: tauri::ipc::Request) -> Result<String, String>
//   thân = byte thô (không đổi sang JSON → file 100 MB vẫn nhanh); tiêu đề: x-artio-folder = pictures|downloads, x-artio-name = tên (mã hóa URL)
```
- Tên file làm sạch như `safeFileName` của web (bỏ `\/:*?"<>|`, ký tự điều khiển, tối đa 120 ký tự) — làm lại ở Rust, không tin phía web.
- Chỉ ghi được 2 thư mục trên. Không có lệnh đọc file tùy ý: chọn ảnh/`.zunva` dùng hộp chọn file của trang web (`<input type=file>`, WebView2 mở hộp thoại Windows) như bản web hiện có.
- Quyền (capabilities): chỉ `core:default` tối thiểu, 1 lệnh `save_file`, `opener:allow-reveal-item-in-dir`. CSP chặt: chỉ tải từ chính app, `blob:`, `data:`.

## 3. Nền tảng Windows trong `@zunva/platform`
- File mới `tauri-platform.ts`: `createTauriPlatform()` gọi lệnh qua `window.__TAURI_INTERNALS__.invoke` (bật `withGlobalTauri`) → app web **không thêm thư viện** Tauri.
  - `gallery.saveImage` → `save_file(pictures)`; `files.saveBytes`/`saveText` → `save_file(downloads)`; trả `{ location: 'Ảnh\\Artio\\<tên>', uri: <đường dẫn> }`.
  - `images.pickImage`, `files.openFile`: dùng lại bản web.
  - Không có `share`, `subject`, `wallpaper` → nút Chia sẻ, Tách nền, Đặt làm hình nền tự ẩn (app đã kiểm tra các trường này [đã kiểm: EditorScreen.tsx dòng 564, ExportSheet.tsx dòng 66, 150]).
  - Mới (tùy chọn trong `Platform`): `reveal?(uri: string): Promise<PlatformResult<void>>` → nút "Mở thư mục" trong bảng Xuất.
- `createPlatform()`: có cầu nối Android → Android; có `__TAURI_INTERNALS__` → Windows; còn lại → web.

## 4. Giao diện máy tính (app web, dùng chung cho mọi bản)
- CSS `@media (min-width: 900px)`: trang chủ/Dự án/Mẫu rộng tối đa ~960 px ở giữa; lưới mẫu 4–5 cột. Màn chỉnh sửa dùng hết chiều ngang.
  Điện thoại không đổi (test 360 px giữ nguyên).
- Phím tắt trong `EditorScreen` (gọi đúng các hành động đang có, nên hoàn tác/lưu tự động giữ nguyên):
  Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z, Delete/Backspace (hỏi lại), Esc, mũi tên (1 px; Shift 10 px; giữ phím liên tục = 1 bước hoàn tác).
  Bỏ qua khi con trỏ đang ở ô gõ chữ/ô nhập.
- Kéo thả: Tauri tắt bắt kéo thả của cửa sổ (`dragDropEnabled: false`) để trang web nhận sự kiện `drop` thường.
  Ảnh thả vào vùng vẽ → như nút "Ảnh"; `.zunva` thả vào trang Dự án → như "Mở file".
- Con trỏ chuột (Kiro, `editor-canvas`): hình bàn tay/di chuyển khi trỏ vào lớp, mũi tên đổi cỡ ở tay nắm, xoay ở nút xoay.

## 5. Dựng và kiểm tra
- Workflow mới `windows-installer.yml` (máy `windows-latest`, miễn phí vì repo công khai [đã kiểm: repo public]):
  pnpm build web → `tauri build --bundles nsis` → artifact `artio-windows-setup` (file `.exe`). Chạy khi PR đổi `zunva/**` hoặc bấm tay.
  Lưu đệm Rust để lần sau nhanh (lần đầu ước khoảng 10–15 phút [giả thuyết]).
- NSIS cài cho riêng người dùng (`installMode: currentUser`), không cần quyền quản trị. WebView2: Windows 11 có sẵn; Windows 10 thiếu thì
  bản cài tự tải (cần mạng lúc cài).
- Biểu tượng: Artio **chưa có logo** (bản Android cũng đang dùng biểu tượng mặc định [đã kiểm: không có ic_launcher]).
  Claude vẽ biểu tượng tạm, nguyên bản (chữ "A" hồng phấn trên nền xanh nhạt, không giống Canva); founder thay sau. Dùng chung cho Android.
- Kịch bản tự kiểm tra laptop `kiem-tra-windows/` (giống bản điện thoại): mở `Artio.exe` với biến môi trường
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`, nối Playwright qua CDP (cách chính thức của Playwright cho WebView2 [đã kiểm]),
  dùng chuột/bàn phím thật, kiểm file trong `Pictures\Artio`/`Downloads\Artio`, xóa dự án thử khi xong.
  - [giả thuyết] Tauri có thể ghi đè biến môi trường này. Dự phòng: bản kiểm tra riêng (giống `ban_kiem_tra` của Android) bật cổng gỡ lỗi qua `additionalBrowserArgs`.
- CI web: thêm một lượt test giao diện ở khổ 1280×800 (Playwright project thứ hai) cho các màn chính.

## 6. Rủi ro
- SmartScreen cảnh báo vì chưa ký số → hướng dẫn founder bấm "Vẫn chạy". Phát hành rộng thì cần ký số (tốn phí, duyệt sau).
- [giả thuyết] Gỡ cài đặt: bản gỡ NSIS của Tauri có ô "xóa dữ liệu app" (mặc định không chọn) — phải thử, ghi rõ trong hướng dẫn.
- Kích thước bản cài phụ thuộc phông + ảnh mẫu (~2,4 MB) + mã → mục tiêu dưới 15 MB; vượt thì báo founder.
