# ZUNVA (nền móng mới — G1)

Mã nguồn ZUNVA mới theo phương án C (PR #27). App v1.5 ở gốc repo vẫn giữ nguyên cho tới khi bản mới thay thế.

| Thư mục | Vai trò |
| --- | --- |
| `packages/core` | Dữ liệu thiết kế, lệnh, lịch sử, lưu trữ. Không React, không DOM. |
| `packages/platform` | Giao diện chung cho lưu file, chọn ảnh, chia sẻ; mỗi vỏ (web, Capacitor, Tauri) làm một bản. |
| `packages/tools` | Các công cụ dạng mô-đun. |
| `apps/web` | Ứng dụng React (Vite). |

Lệnh (cần Node 22 và pnpm 10):

```
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e   # cần: pnpm --filter @zunva/web exec playwright install chromium
```

Đặc tả: `.kiro/specs/g1-nen-mong/`.
