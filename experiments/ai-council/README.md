# ZUNVA AI Council — runtime pilot v0.1

**Mục tiêu:** Bộ điều phối riêng ZUNVA theo ý tưởng founder: 2 AI (Codex + Gemini mặc định) đánh giá độc lập → (tùy chọn) phản biện chéo → báo cáo để founder duyệt.

Đây **chưa phải ứng dụng hoàn chỉnh**, chưa có phòng họp web, chưa liên quan Community Bot công khai. Thư mục experiments/ai-council/ hoàn toàn tách biệt; không sửa Android hoặc PR #5, PR #11.

## Quan hệ với MausBot

- Tham khảo kiến trúc local-first, cách điều phối/giới hạn quyền của https://github.com/milind-soni/OpenMausBot, nhất là registry, delegated assignments và cách gọi Codex nền trong thư mục rỗng/sandbox read-only.
- Đây là **mã ZUNVA viết riêng và đơn giản hóa, phỏng theo cách tổ chức mã nguồn mở**, không phải fork đầy đủ của OpenMausBot.
- Không sử dụng mã enterprise/, tên/logo/linh vật của OpenMausBot. Nguồn và bản quyền ở THIRD_PARTY_NOTICES.md.

## Điều kiện

- Node.js 20+ để chạy script. **Không cần pnpm, không cần cài MausBot, không cần tắt Smart App Control**.
- Mặc định DEMO không gọi mạng, không gọi AI, không tốn quota.
- Chế độ LIVE mặc định sử dụng **Codex CLI đã đăng nhập + Gemini API Free Tier**. Không cần Claude Pro. Dùng hạn mức Codex và Gemini API tùy tài khoản/project, chưa có bộ đo chi phí. Chỉ sử dụng API key thuộc project đã xác nhận **Free Tier** (không liên kết billing). Không lưu key trong repo.
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

Sau khi xác minh Codex đã đăng nhập và Gemini API key thuộc **project Free Tier**, chỉ trong cửa sổ PowerShell của mày nhập key vào prompt ẩn (không gửi key qua chat hoặc GitHub):

    $secret = Read-Host "Gemini API key" -AsSecureString
    $env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new("", $secret).Password

Sau đó có thể thử LIVE với **Codex + Gemini** (tốn hạn mức model):

    node council.mjs --task=brief.txt --live --confirm-usage --agents=codex,gemini --rounds=1 --out=report.md

- rounds=1: tối đa 2 lượt gọi, mỗi AI một lượt.
- rounds=2: tối đa 4 lượt gọi, vòng 2 phản biện lẫn nhau.
- Không tự retry khi lỗi hoặc hết quota.
- Khi kết thúc: `Remove-Item Env:GEMINI_API_KEY` hoặc đóng cửa sổ terminal. Không đưa key vào `brief.txt`, `.env`, issue hay ảnh chụp.
- Google AI Pro và Gemini API là hai quyền lợi khác nhau; **Free Tier dùng thử có giới hạn và có thể được Google sử dụng để cải thiện sản phẩm**. Không gửi nội dung kinh doanh/mã nguồn riêng hoặc dữ liệu người dùng qua API Free.
- Nếu `Gemini request failed (HTTP 429)` hoặc hết quota, **dừng**. Không bật billing để thử tiếp.
- Các lệnh chạy không qua shell, trong thư mục tạm rỗng; Codex dùng sandbox read-only, ignore-user-config và tắt các tool; Claude dùng tools rỗng và permission-mode plan. Các cờ có thể thay đổi theo version của CLI; phải kiểm tra đúng bản. Đây không phải bảo đảm cô lập tuyệt đối.
- Không cấp quyền GitHub hoặc thư mục ZUNVA cho agents. Không nhập khóa API hoặc thông tin riêng vào brief.txt.
- Báo cáo chỉ lưu trên máy, không tự đăng GitHub.

## Chưa làm

- Chưa test việc Codex/Gemini trả lời thật trên laptop founder; đã xác nhận Codex CLI qua Node và có tài khoản ChatGPT. Gemini API connector mới được kiểm tra bằng HTTP giả lập, chưa gọi Google thật; Kiro chưa tích hợp.
- Chưa có UI đa người, quản lý người dùng, hàng đợi, công cụ viết code được duyệt, đo token/chi phí, lịch tự chạy.
- Báo cáo là ý kiến, không phải bằng chứng code đã chạy hay triển khai.

## Mốc v0.2

1. Kiểm tra demo trên Windows và chạy test tự động.
2. Test CLI thật trong máy ảo hoặc môi trường riêng, mỗi AI một lượt, kiểm tra quota.
3. Chỉ bổ sung tác vụ sửa code sau khi có bước duyệt, branch riêng, review và bằng chứng test.
4. Sau đó mới mở giao diện web local; tuyệt đối không công khai server khi chưa kiểm tra bảo mật.

Founder quyết định cuối cùng. Không tự động merge, deploy hay thanh toán.

## Kiểm tra cài đặt Windows của founder (10/11/2026)

- Đã xác nhận từ PowerShell: `node --version` = 26.13.0, `codex.cmd --version` = 0.167.0, `codex.cmd login status` = Logged in using ChatGPT.
- `Test-Path "$env:APPDATA\\npm\\node_modules\\@openai\\codex\\bin\\codex.js"` = True.
- `claude --version` chưa nhận diện, nghĩa là chưa có Claude Code CLI trong PATH.
- **Bước kiểm tra tiếp theo không tiêu lượt AI:** `node "$env:APPDATA\\npm\\node_modules\\@openai\\codex\\bin\\codex.js" --version`.
- Chưa chạy thử LIVE hai agent trên laptop. Không chạy LIVE trước khi Claude Code được cài và xác nhận quota.

## Gemini API Free Tier (cập nhật 10/11/2026)

1. Truy cập https://aistudio.google.com/api-keys bằng tài khoản Google của founder.
2. Tạo một key cho project riêng `ZUNVA-AI-Council` ở tier Free; **không bật billing, không gửi key cho AI hoặc đăng GitHub**.
3. Bản demo offline hoạt động khi chưa có key. Nếu chưa cấu hình Gemini Free Tier, chưa bật `--live`.
4. Gemini CLI bằng tài khoản Google AI Pro cá nhân đã bị Google dừng hỗ trợ theo thông báo 18/06/2026; pilot này dùng **Gemini API Key Free Tier**, không dựa vào quota Gemini Pro.
5. Tài liệu chính thức: https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals và https://ai.google.dev/gemini-api/docs/billing
