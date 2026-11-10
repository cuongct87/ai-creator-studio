# ZUNVA AI Council — runtime pilot v0.1

**Mục tiêu:** Bộ điều phối riêng ZUNVA theo ý tưởng founder: 2 AI đánh giá độc lập → (tùy chọn) phản biện chéo → báo cáo để founder duyệt.

Đây **chưa phải ứng dụng hoàn chỉnh**, chưa có phòng họp web, chưa liên quan Community Bot công khai. Thư mục experiments/ai-council/ hoàn toàn tách biệt; không sửa Android hoặc PR #5, PR #11.

## Quan hệ với MausBot

- Tham khảo kiến trúc local-first, cách điều phối/giới hạn quyền của https://github.com/milind-soni/OpenMausBot, nhất là registry, delegated assignments và cách gọi Codex nền trong thư mục rỗng/sandbox read-only.
- Đây là **mã ZUNVA viết riêng và đơn giản hóa, phỏng theo cách tổ chức mã nguồn mở**, không phải fork đầy đủ của OpenMausBot.
- Không sử dụng mã enterprise/, tên/logo/linh vật của OpenMausBot. Nguồn và bản quyền ở THIRD_PARTY_NOTICES.md.

## Điều kiện

- Node.js 20+ để chạy script. **Không cần pnpm, không cần cài MausBot, không cần tắt Smart App Control**.
- Mặc định DEMO không gọi mạng, không gọi AI, không tốn quota.
- Chế độ LIVE: cần Codex CLI và Claude Code CLI bản native executable trên máy, đã đăng nhập; chi phí/hạn mức tùy tài khoản. Trên Windows script gọi codex.exe và claude.exe, không qua shell. Nếu máy chỉ có shim .cmd, LIVE chưa hỗ trợ; không tắt bảo vệ Windows để ép chạy.
- LIVE phải thêm --live --confirm-usage. Chưa có cách bảo đảm giới hạn tiền API ở tầng nhà cung cấp, nên dùng tài khoản có hạn mức riêng.

## Chạy thử bằng demo (không dùng AI thật)

Tạo file brief.txt trong thư mục này, nội dung ví dụ:

    Đánh giá ý tưởng ZUNVA: người dùng tạo prompt ảnh dễ dàng, giữ miễn phí và bám sát ý tưởng đã chốt.

Mở PowerShell ở thư mục này, chạy:

    node council.mjs --task=brief.txt --demo --rounds=2 --out=report.md

Mở report.md để xem hai vai trò **giả lập** và biểu mẫu trình duyệt. Mỗi câu trả lời demo có nhãn DEMO ONLY.

Kiểm tra tự động:

    node --test council.test.mjs

## Thử hai AI thật (chỉ khi đã kiểm tra điều kiện)

Sau khi kiểm tra các CLI native, đăng nhập, và đồng ý dùng quota:

    node council.mjs --task=brief.txt --live --confirm-usage --rounds=1 --out=report.md

- rounds=1: tối đa 2 lượt gọi, mỗi AI một lượt.
- rounds=2: tối đa 4 lượt gọi, vòng 2 phản biện lẫn nhau.
- Không tự retry khi lỗi hoặc hết quota.
- Các lệnh chạy không qua shell, trong thư mục tạm rỗng; Codex dùng sandbox read-only, ignore-user-config và tắt các tool; Claude dùng tools rỗng và permission-mode plan. Các cờ có thể thay đổi theo version của CLI; phải kiểm tra đúng bản. Đây không phải bảo đảm cô lập tuyệt đối.
- Không cấp quyền GitHub hoặc thư mục ZUNVA cho agents. Không nhập khóa API hoặc thông tin riêng vào brief.txt.
- Báo cáo chỉ lưu trên máy, không tự đăng GitHub.

## Chưa làm

- Chưa test CLI thật trên Windows của founder và chưa xác minh máy đã có Claude/Codex CLI native; chưa kết nối Gemini/Kiro.
- Chưa có UI đa người, quản lý người dùng, hàng đợi, công cụ viết code được duyệt, đo token/chi phí, lịch tự chạy.
- Báo cáo là ý kiến, không phải bằng chứng code đã chạy hay triển khai.

## Mốc v0.2

1. Kiểm tra demo trên Windows và chạy test tự động.
2. Test CLI thật trong máy ảo hoặc môi trường riêng, mỗi AI một lượt, kiểm tra quota.
3. Chỉ bổ sung tác vụ sửa code sau khi có bước duyệt, branch riêng, review và bằng chứng test.
4. Sau đó mới mở giao diện web local; tuyệt đối không công khai server khi chưa kiểm tra bảo mật.

Founder quyết định cuối cùng. Không tự động merge, deploy hay thanh toán.
