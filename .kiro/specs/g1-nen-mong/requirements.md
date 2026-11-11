# G1 — Nền móng ZUNVA mới: Requirements

Mã việc: ZAC-20261111-001 · Nguồn: PR #27 (vòng 2) · Founder duyệt 11/11/2026 13:02: **phương án C** (xây lại nền móng có kiểm soát) và **danh sách G1, trần 300 credit**.

> Rule 2 trong `zunva-rules.md` ("không viết lại cả dự án khi chưa được duyệt") đã được founder duyệt riêng cho G1 này. Các rule khác giữ nguyên.

## Bối cảnh đã kiểm chứng (Kiro, GPT, Claude đọc mã)
- v1.5 gồm 5 file web ở gốc repo (~207 KB), Android chỉ phục vụ đúng 5 file đó.
- Chữ một dòng, phông Arial; hoàn tác chụp cả thiết kế; localStorage tối đa 12 dự án, ảnh base64 nằm trong dự án.
- 4 nơi dịch riêng; Android không có bộ xử lý tải xuống.
- App thử: gói `vn.iaysystem.aicreatorstudio.p2lang`, ký bằng khóa debug; từng có sự cố chữ ký (commit 5d29811).
- Chỉ máy founder (Samsung S24+, One UI 9, Android 17) đang cài app.

## Phạm vi G1
G1-0 founder tự kiểm (0 credit) → G1-1 khóa ký và tên gói → G1-2 khung repo → G1-3 lõi dữ liệu + hoàn tác → G1-4 thử lõi vẽ → G1-5 lưu trên máy + lớp nền tảng → G1-6 file `.zunva` + bộ nhập v1.5 → G1-7 APK G1 và nghiệm thu.

**Đặc tả này chi tiết hóa G1-1 và G1-2.** G1-3 trở đi sẽ viết sau khi G1-2 được nghiệm thu.

Ngoài phạm vi G1: gom 4 nơi dịch (G2), chia sẻ sang Zalo (G2), giao diện trình chỉnh sửa đầy đủ (G2), bản Apple (G5).

## G1-1 — Khóa ký và tên gói chính thức

**R1.1** Founder chốt **tên gói chính thức** (applicationId) trước khi bắt đầu. Kiro không tự chọn. Sau khi app lên cửa hàng, tên gói không đổi được nữa.
- **ĐÃ CHỐT (founder, 11/11/2026): `vn.c87.lsc`.** Chỉ đổi `applicationId`; giữ nguyên `namespace 'vn.iaysystem.aicreatorstudio'` và thư mục Java.

**R1.2** Tạo một **khóa ký phát hành** (keystore) duy nhất cho ZUNVA:
- Tạo trên máy founder bằng `keytool`, thuật toán RSA 4096, hạn ≥ 25 năm.
- **Không bao giờ** commit keystore, mật khẩu, hay chuỗi base64 của nó vào repo, log, PR, chat.
- Founder tự dán vào GitHub Secrets: `ZUNVA_KEYSTORE_B64`, `ZUNVA_KEYSTORE_PASSWORD`, `ZUNVA_KEY_ALIAS`, `ZUNVA_KEY_PASSWORD`.
- Founder giữ **2 bản sao lưu** keystore + mật khẩu ở 2 nơi khác nhau (ví dụ USB và kho mật khẩu). Mất khóa = không bao giờ cập nhật được app đã cài.

**R1.3** Có workflow CI build **APK release ký bằng khóa này** (chạy tay bằng `workflow_dispatch`), tải về dạng artifact. Không phát hành lên cửa hàng.

**R1.4 (có điều kiện)** Chỉ làm nếu kết quả G1-0 cho thấy **có dự án cần giữ** và **nút "Xuất dự án JSON" không ra file trên S24+**: thêm cầu nối Java nhỏ (theo mẫu `AndroidImageSaver`) để lưu chuỗi JSON thành file trong thư mục Tải xuống; nút xuất của v1.5 dùng cầu nối khi có. Không sửa gì khác trong v1.5.

### Tiêu chí đạt G1-1
- [ ] `git grep` không tìm thấy keystore, mật khẩu hay base64 của khóa trong repo.
- [ ] 2 lần chạy workflow cho ra 2 APK có **cùng chứng chỉ SHA-256** (`apksigner verify --print-certs`).
- [ ] APK cài được trên S24+.
- [ ] (Nếu làm R1.4) Bấm xuất trên S24+ → file `.json` xuất hiện trong Tải xuống, mở được.

## G1-2 — Khung repo mới

**R2.1** Mã mới nằm trong thư mục **`zunva/`** ở gốc repo. Không sửa, không xóa 5 file v1.5 ở gốc, không đổi `android/` hiện có trong task này.

**R2.2** Công cụ: Node 22 LTS, pnpm workspaces, Vite, React, TypeScript `strict`. Ghim **phiên bản chính xác** (không dùng `^`/`latest`) và commit file khóa phiên bản.

**R2.3** Chia gói, mỗi gói một `package.json`:

| Gói | Chứa gì | Được phép phụ thuộc |
| --- | --- | --- |
| `packages/core` | Dữ liệu thiết kế, lệnh, lịch sử, lưu trữ (G1-3 điền) | Không React, không DOM, không trình duyệt |
| `packages/platform` | Giao diện chung cho lưu file, chọn ảnh, chia sẻ (chỉ khai báo kiểu ở G1-2) | `core` |
| `packages/tools` | Nơi đặt các công cụ dạng mô-đun (trống ở G1-2) | `core`, `platform` |
| `apps/web` | Ứng dụng React | tất cả gói trên |

**R2.4** Luật kiểm tra hướng phụ thuộc chạy trong lint: `core` import `react`, `react-dom` hoặc dùng `window`/`document` → lint báo lỗi.

**R2.5** `apps/web` hiển thị trang chủ khung: logo chữ ZUNVA, câu "Bạn muốn tạo gì hôm nay?", thanh dưới 5 tab (Trang chủ · Dự án · Mẫu · AI · Tài khoản). Các tab khác chỉ hiện tiêu đề. Đây là bản nội bộ, chưa phát hành.

**R2.6** Kiểm thử: Vitest (ít nhất 1 test mẫu ở `core`), Playwright ở khổ **360×780** kiểm tra trang chủ hiện đủ 5 tab và không cuộn ngang.

**R2.7** Workflow CI `zunva-ci.yml`: chạy khi PR đụng `zunva/**`: cài đặt, lint, kiểm tra kiểu, test, build, Playwright.

### Tiêu chí đạt G1-2
- [ ] CI xanh trên PR.
- [ ] `pnpm -C zunva install && pnpm -C zunva lint && pnpm -C zunva test && pnpm -C zunva build` chạy được trên máy founder.
- [ ] Thử vi phạm: thêm `import React from 'react'` vào `core` → lint báo lỗi (ghi lại trong báo cáo, rồi bỏ dòng thử).
- [ ] `git diff --stat origin/main` chỉ có file trong `zunva/`, `.github/workflows/zunva-ci.yml`, và `.gitignore` (nếu cần).
