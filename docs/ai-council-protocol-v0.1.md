# ZUNVA AI Council — giao thức thử nghiệm v0.1
Ngày: 2026-11-10 · Trạng thái: **ĐỀ XUẤT / CHỜ FOUNDER DUYỆT** · Theo dõi: Issue #8

## 1. Nguồn chuẩn và phạm vi
- **ĐÃ CHỐT bởi founder:** làm sản phẩm hoạt động thật, kiểm soát chi phí; giữ hai chế độ Phổ thông và Nâng cao; ý tưởng gốc và quyết định đã duyệt không được AI tự thay đổi.
- **ĐÃ CHỐT về quyền:** AI có thể sửa code cải tiến trên nhánh riêng, kiểm thử và mở PR, nhưng không push main, merge, deploy, mua dịch vụ, công khai API key hoặc thay đổi lớn chưa duyệt.
- **CHƯA CHỐT:** chọn engine điều phối, số thành viên, tích hợp OpenMausBot/Paperclip, hosting và phương án thương mại.
- **Tách phạm vi:** AI Council là quy trình **nội bộ**. Community Bot (Issue #9, PR #10) là đề xuất khác; không được chia sẻ quyền hoặc dữ liệu.
- PR #5 (Android TEST) còn mở, draft, chưa merge. Issue #6 (Studio canvas) chưa được khởi động khi PR #5 chưa nghiệm thu. Không chạm code hay nhánh của hai hạng mục này.

## 2. Vai trò (dự kiến)
| Vai trò | Trách nhiệm | Quyền thực tế |
| --- | --- | --- |
| Founder | Xác nhận yêu cầu gốc, ưu tiên, chi phí, duyệt quyết định và nghiệm thu | Quyền quyết định cuối |
| ChatGPT — điều phối | Ghi phiếu, tổng hợp, lưu chứng cứ, thực hiện việc được phép trên nhánh riêng | GitHub khi connector khả dụng; không đại diện cho AI khác |
| Reviewer A | Đánh giá độc lập và chỉ rõ rủi ro | Chỉ khi có lời gọi thật và log |
| Reviewer B | Phản biện độc lập | Chỉ khi có lời gọi thật và log |
| Kiro / executor | Chỉnh code trên nhánh riêng, chạy test | Chỉ khi có runner/kết nối và quyền hợp lệ; chưa mặc định kết nối |

**Không ghi một ý kiến dưới tên Claude/Gemini/Kiro nếu thực tế ChatGPT tự tạo.** Ý kiến chưa được nhận: `CHƯA CÓ`. Chép tay thì ghi rõ `THỦ CÔNG`.

## 3. Máy trạng thái và cổng duyệt
`INTAKE → SCOPED → REVIEW_PENDING → REVIEWED → FOUNDER_DECISION → (APPROVED → IMPLEMENTING → TESTED → ACCEPTED | REJECTED | REVISION_REQUESTED)`

- INTAKE: giữ nguyên văn yêu cầu gốc; không lẫn đề xuất AI.
- SCOPED: tiêu chí nghiệm thu, ràng buộc, chi phí tối đa, dữ liệu được phép.
- REVIEW_PENDING: giao từng reviewer cùng một đề bài, không tiết lộ ý kiến reviewer khác trước khi họ phản hồi độc lập.
- REVIEWED: ghi đồng thuận, bất đồng, dẫn chứng, phần chưa chắc chắn.
- FOUNDER_DECISION: `APPROVE`, `REVISE`, `REJECT` hoặc `DEFER`; không tự suy ra sự im lặng là duyệt.
- IMPLEMENTING: chỉ những chỉnh sửa nhỏ, nằm trong phạm vi quyền đã cho, trên nhánh riêng; thay đổi lớn cần duyệt trước.
- TESTED: báo test thật kèm lệnh, môi trường, kết quả, bằng chứng. Không gọi là test thiết bị nếu chưa có thiết bị.
- ACCEPTED: founder xác nhận nghiệm thu; việc merge/deploy vẫn phải có quyết định riêng.

**Điều kiện dừng:** nguy cơ mất code local, lộ secret, chi phí ngoài trần, tác động PR #5/issue #6, hoặc quyền tool chưa rõ → STOP, ghi rủi ro và chờ founder.

## 4. Giao thức trao đổi tối thiểu
- Mỗi việc có ID, issue, phiên bản yêu cầu và dấu thời gian; mọi đầu ra dẫn link hoặc log kiểm chứng được.
- Mọi reviewer nhận cùng `task_brief` và trả `review` với `stance`, `evidence`, `risks`, `cost_estimate`, `confidence`, `unknowns`.
- Điều phối chỉ tổng hợp, không tự gán đồng thuận khi thiếu reviewer. Tối đa **2 AI thực sự được kết nối** ở pilot đầu tiên.
- Nếu copy/paste: `transport=manual`, ai chuyển và lúc nào. Nếu tool: `transport=tool`, tên công cụ, execution id, thời điểm, link log đã che secret.
- Khi kết nối bị lỗi: `status=BLOCKED`, không thay bằng lời mô phỏng.
- Không đưa mật khẩu, khóa API, cookie, token OAuth, dữ liệu riêng người dùng vào issue, prompt công khai hay artifact. Secret lưu ở secret store hoặc local theo đúng quyền.
- Không cho Community Bot public gọi runner, shell, MCP hoặc API Council nội bộ.

## 5. Mẫu phiếu giao việc (copy vào GitHub Issue)
```yaml
task_id: ZAC-YYYYMMDD-001
source_issue: "#8"
state: INTAKE
founder_request_verbatim: |
  [Nguyên văn, không diễn giải]
confirmed_decisions:
  - "[ĐÃ CHỐT]"
new_proposals:
  - "[ĐỀ XUẤT, chưa duyệt]"
goal: "[Kết quả thực tế cần đạt]"
out_of_scope: ["[Không được đụng]"]
acceptance:
  - "[Bằng chứng có thể kiểm tra]"
constraints:
  no_main_push: true
  no_merge: true
  no_deploy: true
  no_paid_services_without_approval: true
  no_secrets_in_issues: true
  protect_pr5: true
budget_cap_usd: 0
reviewers_requested: ["[chỉ điền AI đã kết nối]"]
transport: "[tool | manual | not_connected]"
deadline: "[nếu có]"
```

## 6. Mẫu báo cáo Hội đồng (copy vào Issue hoặc PR)
```yaml
task_id: ZAC-YYYYMMDD-001
status: REVIEW_PENDING
source_request_link: "[issue URL]"
reviewers:
  - name: "[AI A]"
    connection: "[connected | not_connected]"
    transport: "[tool | manual | none]"
    run_evidence: "[log URL hoặc CHƯA CÓ]"
    position: "[ý kiến hoặc CHƯA CÓ]"
    evidence: ["[link cụ thể]"]
    risks: ["[rủi ro]"]
  - name: "[AI B]"
    connection: "[connected | not_connected]"
    transport: "[tool | manual | none]"
    run_evidence: "[log URL hoặc CHƯA CÓ]"
    position: "[ý kiến hoặc CHƯA CÓ]"
agreement: ["[chỉ khi có hai ý kiến thật]"]
disagreement: ["[khác biệt và nguyên nhân]"]
unknowns: ["[điều chưa kiểm chứng]"]
recommendation: "[ĐỀ XUẤT; không phải quyết định]"
estimated_cost_usd: 0
actual_cost_usd: 0
founder_decision: PENDING
execution_branch: null
tests:
  static_review: "[PASS | FAIL | NOT_RUN]"
  automated: "[PASS | FAIL | NOT_RUN]"
  device: NOT_RUN
acceptance: PENDING
```

## 7. Pilot đầu tiên — chưa chạy đa AI
- **Đề xuất task nhỏ:** hai AI độc lập đánh giá phiếu giao việc và các điều kiện an toàn trong tài liệu này; không sửa code sản phẩm.
- Điều kiện bắt đầu: kết nối thật reviewer thứ hai, xác nhận chi phí 0 USD hoặc founder duyệt phí, lập log đầy đủ.
- Thành công khi có hai phản hồi độc lập, một bản tổng hợp chỉ ra đồng thuận/bất đồng, và quyết định founder. **Tài liệu này chưa phải bằng chứng pilot AI↔AI hoạt động.**

## 8. Checklist nghiệm thu tài liệu
- [x] Tách ĐÃ CHỐT và ĐỀ XUẤT
- [x] Có phiếu giao việc và báo cáo với bằng chứng, trạng thái, chi phí
- [x] Có cổng duyệt và điều kiện dừng
- [x] Có phân biệt tool thật / copy tay / chưa kết nối
- [x] Bảo vệ PR #5 và Issue #6
- [ ] Founder duyệt giao thức
- [ ] Reviewer thứ hai kết nối thật
- [ ] Chạy pilot và lưu log
