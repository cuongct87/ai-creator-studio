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

## G1-2 — Khung repo mới (dự toán 25–40 credit) — làm trước, không phụ thuộc G1-0
Nhánh: `feat/g1-2-khung-zunva`
- [ ] 2.1 Tạo `zunva/` với pnpm workspace, `tsconfig.base.json` strict, ghim phiên bản chính xác.
- [ ] 2.2 Tạo `packages/core` (một hàm mẫu + 1 test Vitest), `packages/platform` (chỉ khai báo interface), `packages/tools` (README).
- [ ] 2.3 Tạo `apps/web` (Vite + React) với trang chủ khung theo R2.5.
- [ ] 2.4 ESLint + luật hướng phụ thuộc (design.md). Chạy thử vi phạm rồi bỏ.
- [ ] 2.5 Playwright 360×780: 5 tab hiện đủ, không cuộn ngang.
- [ ] 2.6 `.github/workflows/zunva-ci.yml` theo R2.7.
- [ ] 2.7 Kiểm tra tiêu chí đạt G1-2, mở PR, báo cáo.

## G1-1 — Khóa ký và tên gói (dự toán 15–30 credit) — chờ founder chốt tên gói và G1-0
Nhánh: `feat/g1-1-khoa-ky`
- [ ] 1.1 Hướng dẫn founder từng lệnh `keytool` để tạo keystore **trên máy founder**, cách mã hóa base64 và dán 4 secret vào GitHub. Kiro không tự đọc hay in mật khẩu.
- [ ] 1.2 Workflow `android-release-apk.yml` (chỉ `workflow_dispatch`): giải mã keystore từ secret, build release với tên gói đã chốt, ký, xuất artifact, xóa file khóa tạm.
- [ ] 1.3 Chạy workflow 2 lần, so chứng chỉ SHA-256 hai APK.
- [ ] 1.4 (Chỉ khi G1-0 cần) Cầu nối `AndroidFileSaver` + sửa hàm xuất JSON trong `studio_v15.js` (design.md). Thử trên S24+.
- [ ] 1.5 Kiểm tra tiêu chí đạt G1-1, mở PR, báo cáo.

## G1-3 → G1-7
Đặc tả chi tiết viết sau khi G1-2 được nghiệm thu.
