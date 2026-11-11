# G1 — Nền móng ZUNVA mới: Design

## Vì sao thư mục `zunva/` trong cùng repo
- Giữ lịch sử, CI, Gemini tự nhận xét PR, và 5 file v1.5 vẫn chạy song song cho tới khi bản mới thay thế (G1-7).
- Android hiện chỉ đóng gói 5 file v1.5 (`syncWebAssets` trong `android/app/build.gradle`), nên thư mục mới không ảnh hưởng APK cũ.

## Cấu trúc
```
zunva/
  package.json            # workspace gốc, scripts: lint, typecheck, test, build, e2e
  pnpm-workspace.yaml
  tsconfig.base.json      # strict
  eslint.config.js        # gồm luật hướng phụ thuộc
  packages/
    core/                 # thuần TypeScript, không DOM
    platform/             # interface: FileSaver, ImagePicker, Share (chỉ kiểu ở G1-2)
    tools/                # trống, có README giải thích hợp đồng công cụ (G1-3 viết)
  apps/
    web/                  # Vite + React
      e2e/home.spec.ts    # Playwright 360x780
```

## Luật hướng phụ thuộc
Dùng `no-restricted-imports` và `no-restricted-globals` của ESLint theo từng thư mục (không cần plugin thêm):
- `packages/core/**`: cấm `react`, `react-dom`, `@zunva/platform`, `@zunva/tools`; cấm global `window`, `document`, `localStorage`.
- `packages/platform/**`: cấm `react`, `react-dom`, `@zunva/tools`.

## Khóa ký (G1-1)
- Keystore tạo một lần trên máy founder. Workflow giải mã từ secret ra file tạm trong runner, ký, rồi xóa.
- Ở G1-1 workflow ký **module Android hiện có** với tên gói founder chốt, để kiểm chứng khóa. Vỏ Capacitor cho ứng dụng mới dùng lại đúng khóa này ở G1-7.
- Không đổi `debug` build type đang dùng cho bản thử `.p2lang`.

## Cầu nối xuất file (R1.4, có điều kiện)
- Lớp Java `AndroidFileSaver` cạnh `AndroidImageSaver`, phương thức `saveText(fileName, mimeType, content)` ghi vào `MediaStore.Downloads` (Android 10+), trả về đường dẫn hoặc thông báo lỗi.
- Trong `studio_v15.js`, hàm xuất JSON gọi `window.AndroidFileSaver.saveText(...)` nếu có, ngược lại dùng cách tải xuống như cũ.

## Không làm ở G1-1, G1-2
Không thêm thư viện vẽ, không IndexedDB, không Capacitor, không i18next. Các phần đó thuộc G1-3 → G1-7.
