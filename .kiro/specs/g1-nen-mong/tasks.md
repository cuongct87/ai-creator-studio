# G1 — Nền móng ZUNVA mới: Tasks

Luật chung cho mọi task:
- Mỗi task: **một phiên Kiro mới**, một nhánh, **một PR riêng** vào `main`, không merge (founder merge).
- Đầu báo cáo ghi **credit ước tính**; cuối báo cáo ghi **credit thật** (Est. Credits Used). Vượt 50% dự toán → dừng, báo founder.
- Báo cáo bằng tiếng Việt dễ hiểu: đã đổi gì, lệnh đã chạy và kết quả, việc chưa làm.
- Không đưa khóa, mật khẩu, keystore vào repo, log, PR hay chat.

## G1-0 — Founder tự kiểm (0 credit) — chờ founder
- [ ] Có mấy app AI Creator Studio / ZUNVA trên S24+, tên gói nếu xem được.
- [ ] Có dự án nào cần giữ không, bao nhiêu.
- [ ] Bấm "Xuất dự án JSON": có ra file trong Tải xuống không.

## G1-2 — Khung repo mới — XONG (Claude, PR #32, 0 credit Kiro)
Nhánh: `feat/g1-2-khung-zunva`
- [ ] 2.1 Tạo `zunva/` với pnpm workspace, `tsconfig.base.json` strict, ghim phiên bản chính xác.
- [ ] 2.2 Tạo `packages/core` (một hàm mẫu + 1 test Vitest), `packages/platform` (chỉ khai báo interface), `packages/tools` (README).
- [ ] 2.3 Tạo `apps/web` (Vite + React) với trang chủ khung theo R2.5.
- [ ] 2.4 ESLint + luật hướng phụ thuộc (design.md). Chạy thử vi phạm rồi bỏ.
- [ ] 2.5 Playwright 360×780: 5 tab hiện đủ, không cuộn ngang.
- [ ] 2.6 `.github/workflows/zunva-ci.yml` theo R2.7.
- [ ] 2.7 Kiểm tra tiêu chí đạt G1-2, mở PR, báo cáo.

## G1-1 — Khóa ký và tên gói (dự toán 15–30 credit) — tên gói đã chốt, 1.4 chờ G1-0
Nhánh: `feat/g1-1-khoa-ky` · Tên gói chính thức: **`vn.c87.lsc`** (founder chốt 11/11/2026)
- [ ] 1.1 Hướng dẫn founder từng lệnh `keytool` để tạo keystore **trên máy founder**, cách mã hóa base64 và dán 4 secret vào GitHub. Kiro không tự đọc hay in mật khẩu.
- [ ] 1.2 Workflow `android-release-apk.yml` (chỉ `workflow_dispatch`): giải mã keystore từ secret, build release với tên gói đã chốt, ký, xuất artifact, xóa file khóa tạm.
- [ ] 1.3 Chạy workflow 2 lần, so chứng chỉ SHA-256 hai APK.
- [ ] 1.4 (Chỉ khi G1-0 cần) Cầu nối `AndroidFileSaver` + sửa hàm xuất JSON trong `studio_v15.js` (design.md). Thử trên S24+.
- [ ] 1.5 Kiểm tra tiêu chí đạt G1-1, mở PR, báo cáo.

## Chia việc song song (founder chốt 11/11 13:33)
Credit Kiro hết hạn sau 2 tháng nên Kiro và Claude chạy song song, mỗi bên một thư mục, không sửa file của nhau. Chỉ `zunva/pnpm-lock.yaml` có thể xung đột: bên merge sau chạy lại `pnpm install` để tạo lại file khóa.

| Task | Người làm | Thư mục được sửa |
| --- | --- | --- |
| G1-3 Lõi dữ liệu + hoàn tác | Claude | `zunva/packages/core/` |
| G1-4 Thử lõi vẽ Konva trên điện thoại thật | Kiro (chạy trên laptop founder, cùng Wi-Fi với S24+) | `zunva/apps/poc-konva/` (mới) |

## G1-3 — Lõi dữ liệu v2 và hoàn tác theo lệnh (Claude)
Nhánh: `feat/g1-3-core-data`
- [ ] 3.1 Mô hình `Document → Page → Layer` (chữ, ảnh, hình) và `Asset`; mỗi phần tử có ID cố định; `schemaVersion: 2`; trang có `duration`, lớp có `timing`/`animation` để trống (chỗ cho video sau 1.0).
- [ ] 3.2 Kiểm tra dữ liệu bằng khuôn (zod): dữ liệu sai bị từ chối kèm lý do.
- [ ] 3.3 Lệnh (command) thêm/sửa/xóa/sắp lớp; giao dịch gộp nhiều thay đổi thành một bước hoàn tác (ví dụ kéo một vật).
- [ ] 3.4 Lịch sử hoàn tác/làm lại theo lệnh, không chụp cả thiết kế.
- [ ] 3.5 Test: 100 thao tác ngẫu nhiên rồi hoàn tác hết → về đúng trạng thái đầu; làm lại hết → về đúng trạng thái cuối.
- Đạt: CI xanh; lõi vẫn qua luật không gọi React/DOM.

## G1-4 — Thử lõi vẽ Konva trên S24+ (Kiro, dự toán 50–150 credit)
Nhánh: `feat/g1-4-poc-konva`. Ứng dụng thử **độc lập** `zunva/apps/poc-konva` (Vite + React + `react-konva` + `konva`, cài bằng `pnpm add -E`). Không import code chưa có của `@zunva/core`; không sửa gói khác.
- [ ] 4.1 Một trang 1080×1350 (có nút đổi sang 1748×2480), 30 vật: chữ nhiều dòng tiếng Việt, hình, 2 ảnh lớn (≥ 3000 px, tự tạo bằng canvas, không lấy ảnh có bản quyền).
- [ ] 4.2 Phông Việt đi kèm app, giấy phép OFL (ví dụ `@fontsource/be-vietnam-pro`, `@fontsource/playfair-display`); chờ phông tải xong mới vẽ.
- [ ] 4.3 Chọn vật; kéo, xoay, đổi cỡ bằng `Transformer`; chụm hai ngón để phóng to/thu nhỏ trang.
- [ ] 4.4 Sửa chữ trực tiếp: chạm hai lần vào chữ → hiện ô `textarea` đúng vị trí, gõ xong cập nhật chữ.
- [ ] 4.5 Cắt ảnh cơ bản (khung cắt), nhóm 2 vật, hoàn tác đơn giản (trong bản thử được chụp cả trang).
- [ ] 4.6 Đồng hồ FPS hiện trên màn hình; nút "Xuất PNG".
- [ ] 4.7 Chạy `pnpm --filter @zunva/poc-konva dev --host`, founder mở trên S24+ bằng địa chỉ IP của laptop (cùng Wi-Fi; cho phép tường lửa Windows ở mạng riêng).
- [ ] 4.8 Founder thử và Kiro ghi bảng kết quả trong PR: FPS khi kéo (S24+ và một máy yếu nếu có), gõ Telex và VNI bằng Gboard/Laban Key có lỗi dấu không, có treo/giật không, dung lượng bản build.
- Đạt: kéo ≥ 30 FPS trên S24+, gõ Telex không lỗi dấu, không treo. Nếu trượt: báo founder, chưa thử Fabric khi founder chưa duyệt.

## G1-5 → G1-7
Đặc tả chi tiết viết sau khi G1-3 và G1-4 xong.
