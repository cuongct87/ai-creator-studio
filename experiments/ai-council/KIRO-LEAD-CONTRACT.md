# ZUNVA AI Council — hợp đồng điều phối kỹ thuật cho Kiro V3

**Trạng thái:** Cấu hình mã nguồn, chưa chứng minh đã chạy trong Kiro của founder. Chỉ áp dụng trong nhánh thử nghiệm PR #12.

## 1. Nguyên tắc gốc

- ZUNVA là nền tảng AI Creator Studio thống nhất, ưu tiên người dùng thật và khả năng quay lại sử dụng. Không biến thành bộ trình diễn kỹ thuật.
- Chế độ Phổ thông ít bước; Nâng cao/Chuyên nghiệp có thêm quyền tùy chỉnh. Hỗ trợ tiếng Việt trước, đa ngôn ngữ theo lộ trình.
- Tối ưu chi phí, cân bằng chất lượng/hiệu suất, không mua domain hoặc dịch vụ trước khi ứng dụng được xác minh hữu ích.
- Những đề xuất từ hội đồng là ý kiến tư vấn; **chưa phải quyết định Founder đã chốt**.
- Mọi việc gây phát sinh phí, đưa dữ liệu ra bên ngoài, nâng quyền, sửa main, merge hoặc deploy phải được founder đồng ý riêng trước khi tiến hành.

## 2. Cấu trúc họp và giao việc

Khi Founder đã duyệt một vấn đề và Kiro V3 có subagents, agent chính điều phối tối đa 3 vai trò, chỉ dùng trong Kiro native:

1. **Builder**: đọc yêu cầu, sửa một phạm vi nhỏ trên nhánh riêng, bổ sung test.
2. **Reviewer**: tự đọc diff, tìm lỗi logic, rò rỉ secrets, vượt scope, đưa checklist cụ thể; không tự sửa chồng Builder.
3. **Tester**: chạy kiểm thử offline phù hợp, đối chiếu tiêu chí nghiệm thu, báo lệnh thật đã chạy/giới hạn chưa kiểm chứng.

Nếu subagent không khả dụng, thực hiện tuần tự và ghi chính xác. Nếu Kiro đang chạy Auto, không gọi đó là Opus. Chỉ gọi là Claude Opus khi giao diện /model hoặc log phiên xác minh model thực sự được dùng.

**Không phát sinh vòng lặp họp vô hạn:** Tối đa một lượt giao việc và một lượt phản biện cho cùng thay đổi, sau đó đưa kết quả hoặc blocker ra cho Founder; đề xuất lần sau phải có lợi ích rõ.

## 3. Phạm vi triển khai đầu tiên

- Repo: https://github.com/cuongct87/ai-creator-studio
- PR dự án Council: https://github.com/cuongct87/ai-creator-studio/pull/12
- Phiếu việc Kiro: https://github.com/cuongct87/ai-creator-studio/issues/13
- Scope cho phép: experiments/ai-council/** và cấu hình Kiro chuyên dùng cho Council trên nhánh riêng.
- Phạm vi CẤM: Android/PR #5, code ngoài scope khi chưa có phê duyệt, file credentials .env, API key, dữ liệu cá nhân của khách, cấp quyền toàn hệ thống.
- Không dùng chiêu vượt Smart App Control, không tắt Defender, không cho các agent truy cập GitHub token trực tiếp nếu chưa cần.

## 4. Tiêu chí hoàn thành một nhiệm vụ

Báo cáo phải có đủ:
- **Mục tiêu và mã Issue**;
- **Mã commit/nhánh PR** (hoặc nêu không có nếu chỉ nghiên cứu);
- **Những tệp thực sự đã sửa** (hoặc xác nhận không sửa);
- **Test thực tế**: lệnh, môi trường, số đạt/trượt, lỗi cần sửa;
- **Đối chiếu yêu cầu**: đạt/chưa đạt;
- **Bảo mật và chi phí**: API keys không được đưa vào code/log, không tốn thêm dịch vụ ngoài hạn mức cho phép;
- **Founder duyệt**: Duyệt/Chỉnh sửa/Từ chối, chưa merge/deploy.

## 5. Cổng quyền hạn

Cho phép các hành động quan sát và kiểm thử offline trên bản sao riêng khi được người dùng/Kiro cấp quyền thích hợp. Đừng yêu cầu 'trust all tools', tự tạo quy tắc allow vĩnh viễn hay tự dùng cloud session. Mọi hành động ghi GitHub, push PR, chạy API AI LIVE, mua credits hoặc truy cập secrets phải xin duyệt cụ thể.

Agent nào thất bại thì ghi FAIL. Không chấp nhận việc thay báo cáo giả lập cho kết quả kiểm thử hay gắn nhãn sẵn sàng khi chưa có chứng cứ.

## 6. Giới hạn tích hợp

- Kiro có thể dùng subagents ngay trong môi trường Kiro V3. Kết nối này **không biến Claude web/Claude Code Free thành agent có quyền điều khiển máy**, cũng không mở hạn mức subscription của Kiro cho ứng dụng bên thứ ba.
- ZUNVA dashboard local hiện điều phối Codex/Gemini; Claude trong dashboard là adapter riêng chỉ kích hoạt khi Claude Code được xác thực hợp lệ. **Kiro Lead trong tệp này là con đường native độc lập**, không có đồng bộ chạy tự động từ ZUNVA dashboard.
- Việc đồng bộ GitHub/task giữa hai hệ thống chỉ được coi là hoàn thành khi có code và end-to-end test thật, không dựa vào mô tả.
