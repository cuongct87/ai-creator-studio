# ZUNVA — TẦM NHÌN GỐC CỦA FOUNDER & LỆNH THI CÔNG CHO CLAUDE/KIRO

**Ngày tổng hợp:** 10/11/2026  
**Nguồn:** các quyết định founder đã trình bày; bản *ZUNVA MASTER PROJECT BLUEPRINT v1* (06/11/2026); Issue #8; PR #5, PR #12 và thử nghiệm Windows gần nhất.  
**Vai trò:** tài liệu giao việc giải thích *ý tưởng của founder*, không phải bằng chứng rằng tất cả tính năng đã xây xong.  
**Mức ưu tiên khi có mâu thuẫn:** lời xác nhận mới nhất của founder > Blueprint và quyết định gốc > code/thực tế đã test > đề xuất AI. Mỗi đề xuất chưa duyệt phải ghi **ĐỀ XUẤT**.

## 0. LỜI FOUNDER — ĐIỀU CỐT LÕI NHẤT

> “Tao đưa ý tưởng, tụi mày thiết kế và triển khai. Tao không phải lập trình viên. Tao chỉ duyệt sản phẩm khi có cái chạy thật; không đúng thì tao góp ý và tụi mày sửa. Ra sản phẩm ngon mà không ai dùng thì cũng bỏ. Làm cho người ta dùng hằng ngày, không phải demo đẹp.”

**Đây là diễn giải nội dung, không phải nguyên văn một phát biểu duy nhất.** Mục tiêu không phải có thật nhiều AI hay tính năng trình diễn mà là một nền tảng sáng tạo **có ích, hoạt động ổn định, dễ dùng, giữ chân người dùng**; hạn chế chi phí vận hành vì vốn ban đầu ít.

### Phân biệt 3 thứ, TUYỆT ĐỐI không đánh đồng

1. **ZUNVA — sản phẩm cho người dùng cuối:** một hệ sinh thái sáng tạo hình ảnh, thiết kế, video, mẫu, AI và cộng đồng; phần quan trọng nhất là *Studio chỉnh sửa thực sự dùng được*.
2. **AI Creator Studio v1.5 Beta — mã nguồn kế thừa:** hiện có GitHub `cuongct87/ai-creator-studio`. Đây là nền để phát triển ZUNVA; không viết lại từ số không nếu không có lý do kỹ thuật chứng minh. “ZUNVA” hiện là thương hiệu định hướng; chưa tự ý đổi tên package/mã nguồn.
3. **ZUNVA AI Council — công cụ nội bộ phục vụ thi công:** ChatGPT/Codex/Gemini/Kiro và, khi quyền cho phép, Claude phối hợp phân tích, phản biện, viết code, kiểm thử và báo founder duyệt. Không biến phòng họp thành sản phẩm chính hoặc lấy số cuộc họp làm KPI.

## 1. AI LÀM GÌ — FOUNDER LÀM GÌ

- **Founder:** nói mục tiêu, bổ sung ý tưởng, kiểm thử bản có thể sử dụng, phê duyệt thay đổi quan trọng, quyết định có thương mại hóa/chi tiền hay không. Không buộc founder viết code, gõ nhiều lệnh vặt hoặc quản lý từng sub-agent.
- **ChatGPT:** biên soạn yêu cầu đúng ý founder, ưu tiên công việc, đối chiếu kết quả với ý tưởng, rà GitHub và bằng chứng; không tuyên bố tự điều khiển máy của founder khi chưa có kết nối thực.
- **Kiro V3 (Kiro-native, giữ model Auto):** kỹ sư triển khai; tận dụng khả năng chọn model theo tác vụ để tiết kiệm credits thưởng. Khi Kiro hỗ trợ và được phép, dùng custom agent `zunva-council-lead` để phân Builder / Reviewer / Tester. **Không ép mọi việc chạy Opus.**
- **Claude:** được founder mong muốn là “bộ não” phân tích kiến trúc/điều phối trong Kiro nếu Auto thực sự chọn Claude và tài khoản có quyền. Việc tên Opus xuất hiện trong danh sách model không chứng minh có thể dùng; không tự nhận Claude Code đã đăng nhập (trước đây `loggedIn:false`).
- **Codex + Gemini:** đã có bằng chứng 2 vòng LIVE tư vấn/phản biện văn bản và báo cáo founder; không đồng nghĩa đã tự sửa code hoặc chạy liên tục.
- **Kiro** đã đăng nhập GitHub trên Windows và founder gửi ảnh Kiro đọc Issue #13, kiểm thử, nêu lỗi, xin duyệt nhánh/PR. Không mặc định đã push/merge khi thiếu link và CI.

**Quyền hạn kỹ thuật:** Được chủ động sửa code trong phạm vi hạng mục đã giao trên nhánh riêng, có test; không cần xin phép mỗi lần thay dòng code nhỏ. Nhưng không tự merge, deploy, mua API/credits, chạy dịch vụ trả phí, đăng bài quảng cáo, đưa secret ra ngoài, tắt bảo mật Windows, sửa Android PR #5 chồng chéo, hay tự công khai dữ liệu/tác phẩm.

## 2. TRẢI NGHIỆM SẢN PHẨM PHẢI THÀNH HÌNH

### Ba cửa vào, một trình chỉnh sửa dùng được

Người dùng mở ZUNVA có 3 lựa chọn rõ:
1. **“Tạo bằng AI”** — mô tả bằng ngôn ngữ tự nhiên, hệ thống hỗ trợ tạo bước đầu.
2. **“Khám phá mẫu”** — chọn mẫu sẵn có/cộng đồng (khi có cộng đồng).
3. **“Trang trắng”** — tự thiết kế ngay cả khi không có AI hoặc API key.

Cả 3 cuối cùng đưa về **cùng một trình chỉnh sửa (editor)** với dữ liệu có cấu trúc. Không chỉ xuất hình PNG phẳng rồi gọi là editor.

### Studio đồ họa / ấn phẩm / thiết kế số

**Tối thiểu phải hoạt động được:**
- Canvas kéo-thả, chọn đối tượng, thêm/sửa chữ, ảnh và hình dạng.
- Layer, thay đổi vị trí và kích thước, căn chỉnh, màu sắc, xếp chồng, xóa và nhân bản đối tượng; undo/redo.
- Tạo dự án, **lưu → thoát → mở lại → chỉnh sửa tiếp**, không mất layer/tài nguyên/font nếu đã được hỗ trợ.
- Chọn khổ, tỉ lệ khung, mm/cm cho tác phẩm in; xuất file độ phân giải phù hợp mục đích.
- Các công việc thực tế: banner, biển quảng cáo, thiệp cưới, cáo phó, ấn phẩm sự kiện, bài đăng bán hàng, nội dung mạng xã hội; không chỉ dự án prompt.
- UI có **Phổ thông** (ít thao tác, hướng dẫn rõ cho người mới) và **Nâng cao/Chuyên nghiệp** (thêm thông số, công cụ chuyên dụng) nhưng chung dữ liệu dự án.

### AI hỗ trợ sáng tạo

- Mô tả ảnh/video, gợi ý nội dung, tạo/chỉnh ảnh, xử lý hình, hướng dẫn thao tác thiết kế; chỉ hiện các lựa chọn khi provider/model thực sự có khả năng.
- “Prompt Studio”, “Image Toolkit”, “Video Storyboard”, “Prompt Vault/Work Templates”, “Print Studio Pro”, “AI Pro” là các thành phần được nhắc trong lịch sử v1.5: **phải kiểm kê và test, không mặc định đã hoạt động đầy đủ**.
- Storyboard mẫu 5 cảnh × 6 giây/cảnh từng được làm thử: mỗi cảnh có sự kiện, khung hình, image prompt, motion prompt, thời lượng; có mở đầu/giữa/kết. Đây là khả năng mẫu, không phải giới hạn toàn bộ sản phẩm.
- Video giai đoạn sớm: **prompt-to-video**, có thể image-to-video nếu API cho phép; xem trước và lưu vào dự án. Video timeline chuyên nghiệp (nhập clip người dùng, cắt ghép, âm thanh/chữ/chuyển cảnh/tốc độ) để giai đoạn sau; tránh xây đồ sộ trước khi Studio cơ bản ổn.

### AI nhiều nhà cung cấp — tiết kiệm và công bằng

- Người mới vẫn dùng được thiết kế cơ bản khi không có API key. **BYOK** (Bring Your Own Key) cho người dùng chủ động nối OpenAI, Gemini, Claude, DeepSeek và nhà cung cấp khả dụng khác; kết nối đúng theo API/quyền nhà cung cấp.
- Mô hình dự kiến: Free đủ để sáng tạo cơ bản; AI Pro/BYOK cho người cần AI mạnh. **Không khóa BYOK chỉ vì người dùng không mua Pro.**
- Tách bạch subscription chat cá nhân với API tính phí. Không giả định Gemini Pro = Gemini API trả phí, Claude Free = Claude Code, Kiro credits = Claude API dùng chung.
- Có trạng thái gọi AI, lỗi, hạn mức, cảnh báo phí; không nhập key vào source, GitHub, log, report, client public; không gửi mã nguồn/dữ liệu mật qua Gemini API Free.
- Chỉ tối ưu model routing/caching khi đo được **chi phí mỗi tác phẩm được người dùng chấp nhận**, chất lượng, số lần thử lại và retention; không khẳng định chắc giảm 40% từ ý kiến AI Council.

### Dữ liệu lưu ở đâu?

- **Local-first:** dự án có bản gốc chỉnh được, auto-save trong giới hạn nền tảng, có xuất/nhập file dự án; không lệ thuộc cloud của ZUNVA để tiếp tục chỉnh sửa.
- Lâu dài hỗ trợ **backup cloud cá nhân** như Google Drive/OneDrive bằng OAuth/ủy quyền hợp lệ, xem trạng thái sao lưu/khôi phục/phiên bản; hiện chưa chốt provider hay chi phí. Browser storage có thể mất; cần cảnh báo và chức năng export an toàn.
- Tài nguyên font/media/layer nên nằm trong định dạng dự án có version và kiểm tra tính toàn vẹn; sao lưu phải có test khôi phục thật.

### Cộng đồng — động lực tăng trưởng dài hạn

- Thư viện mẫu, hồ sơ tác giả, tìm kiếm/xem trước/lưu yêu thích, sao chép mẫu hợp lệ để chỉnh sửa; mẫu cá nhân riêng tư **không tự công khai**.
- Cộng đồng có thể chia sẻ, tặng miễn phí hoặc bán mẫu/tác phẩm/dịch vụ với giấy phép và quyền tác giả rõ ràng. Nội dung có báo cáo vi phạm, xử lý khiếu nại và lịch sử nguồn.
- Không tích hợp thanh toán/gian hàng thật cho đến khi có cơ sở pháp lý, chính sách hoàn tiền, thuế, đối soát và nhu cầu thực.
- Community Bot công khai lấy cảm hứng từ ý tưởng open-source là **kênh mở rộng thử nghiệm để mọi người biết ZUNVA**, không phải bắt buộc phải có trước Studio; không dùng nó để đốt API miễn phí vô hạn.

## 3. NGƯỜI DÙNG MỤC TIÊU VÀ ĐIỀU HỌ THỰC SỰ CẦN

Nhóm ví dụ đã trao đổi: người bán hàng nhỏ, nhà sáng tạo nội dung TikTok/YouTube/Facebook, học sinh/người mới, người làm thiết kế nhanh, tiệm in quảng cáo/đám cưới/đám tang; người không giỏi prompt hoặc không muốn cài quá nhiều app.

Các hành trình phải thử bằng người dùng thật:
- Người bán hàng mở app → chọn mẫu bài đăng → sửa tên/giá/ảnh → xuất bản sử dụng được.
- Người làm in tạo mẫu thiệp/biển/cáo phó → chỉnh thông số/kích thước → xuất file đúng mục đích → lưu/mở lại.
- Người sáng tạo nhập ý tưởng ảnh/video → AI cho bản nháp phù hợp → tự sửa trong Studio → lưu tài nguyên/đăng chia sẻ nếu muốn.
- Người dùng không có API key vẫn tạo được sản phẩm cơ bản.

**Mục tiêu trải nghiệm:** người mới có tác phẩm đầu tiên nhanh, ít bước, có lý do quay lại dùng. Theo dõi sản phẩm hoàn thành, thời gian đến kết quả đầu tiên, tỷ lệ lưu/xuất, lỗi, lượt quay lại ngày 7 và chi phí trên tác phẩm hợp lệ; không chạy A/B test khi chưa có lượng người thử đủ.

## 4. NGÔN NGỮ, THIẾT BỊ VÀ CHẤT LƯỢNG

- Nền tảng mục tiêu ban đầu **Web + Android**, tận dụng mã v1.5 đang có. Không tự thay framework hay chuyển kiến trúc khi chưa kiểm kê.
- Ngôn ngữ mục tiêu đầu: **Việt, Anh, Trung, Hàn, Tây Ban Nha**; có thể xét Thái/Nhật về sau. Đầu tiên phải kiểm tra tính thống nhất i18n hiện tại.
- Giao diện thân thiện di động/điện thoại và màn hình lớn, đúng kích thước, bàn phím, thao tác cảm ứng; không chấp nhận ứng dụng toàn button chết, ảnh minh họa thay chức năng thật.
- Độ ổn định, an toàn data, bảo mật, khả năng khôi phục và export đáng tin cậy đứng trước hiệu ứng đẹp.

## 5. THỨ TỰ TRIỂN KHAI: ĐỪNG ĐỂ COUNCIL LẤN ÁT SẢN PHẨM

Áp dụng **P0–P8** trong Blueprint 06/11/2026, điều chỉnh sau audit bằng chứng:

- **P0 — Kiểm kê bắt buộc:** repo, branch và worktree; cấu trúc và tính năng có thật; khả năng build/test web/Android; những lỗi còn mở; mốc checkpoint; không viết lại.
- **P1 — Sửa nền hiện tại:** navigation/tab, i18n, ảnh/video/storyboard/prompt/vault/BYOK đang có, lưu/xuất; kiểm thử hồi quy và không đụng vô ý nhánh Android.
- **P2 — Editor sáng tạo thật:** canvas/layer/text/image/shapes/undo-redo + lưu/mở tiếp + xuất file. Đây là **cột sống của ZUNVA**, trước nhiều tính năng cộng đồng hoặc phòng họp đẹp.
- **P3 — AI hình ảnh & video bằng prompt:** adapter an toàn, trải nghiệm đầu-cuối, thử một provider/model thật đúng quyền.
- **P4 — Lưu bền và sao lưu tùy chọn:** import/export dự án và backup có kiểm thử khôi phục.
- **P5 — Mẫu/cộng đồng:** tác giả, quyền, tìm kiếm, clone mẫu, báo cáo.
- **P6 — Video timeline:** dựng từ clip và media đã có, performance, export.
- **P7 — Free/Pro/marketplace:** chỉ triển khai thương mại khi có dữ liệu sử dụng, tài chính và pháp lý rõ.
- **P8 — Beta cộng đồng + nghiệm thu:** founder dùng thử, sửa theo bug, mời nhóm nhỏ, đo giữ chân, nhận phản hồi, tối ưu chi phí và mở rộng.

**Nhánh đang được bảo vệ:** PR #5 về APK Android TEST vẫn là luồng riêng chờ duyệt. PR #12 / Issue #8 là AI Council. Issue #13 là Kiro kiểm thử nội bộ. **Không lấy việc hoàn thành PR #12 thay thế bằng chứng ZUNVA main app P2 đã chạy.**

## 6. CHIẾN LƯỢC GIỚI THIỆU & GIỮ NGƯỜI DÙNG

Chỉ khi lõi thực sự dùng được:
1. Đưa bản beta cho nhóm người dùng nhỏ; thu lỗi, mức hài lòng, tỷ lệ hoàn thành, giữ chân; sửa tới khi thực sự hữu ích.
2. Tạo video demo ngắn **bằng thao tác thật** (không quảng cáo tính năng chưa tồn tại), hướng dẫn ngắn và mẫu “trước/sau”.
3. Dùng Facebook, TikTok, YouTube, cộng đồng nội dung/thiết kế/tiệm in để thu hút người dùng tự nhiên trước; founder có thể tạo tài khoản riêng cho ZUNVA. Đăng bài qua quyền kết nối hợp lệ và tuân thủ nền tảng; **không tự đăng quảng cáo/trả tiền** khi chưa duyệt.
4. Lắng nghe phản hồi và sửa; chỉ xét mua domain, đầu tư lớn, gọi vốn khi nền tảng ổn và có bằng chứng người dùng thực sự quan tâm.

## 7. QUY TẮC LÀM VIỆC CHO CLAUDE/KIRO (KỂ CẢ AGENT AUTO)

**Không được sáng tác lại tầm nhìn ZUNVA.** Claude/Kiro phải bám ý tưởng và lựa chọn đã chốt; mọi chi tiết chưa có quyết định đưa vào mục “ĐỀ XUẤT” hoặc “CHƯA CHỐT”.

- Kiro **giữ chế độ Auto** để tối ưu credit; nếu Auto dùng Claude thì vẫn không khẳng định là Opus 5.5 trừ khi log/đúng model được xác minh. Không tự chuyển model x2 credit cho mọi task.
- Khi có quyền subagent, Kiro-native lead phân công Builder, Reviewer, Tester, nhưng tối đa một vòng giao/đánh giá hợp lý cho mỗi việc; không agent hội họp vô hạn.
- Mỗi hạng mục có mã issue, yêu cầu, checklist nghiệm thu, phạm vi tệp, bằng chứng test, rủi ro và chi phí dự kiến. Một nhiệm vụ nhỏ làm đến nơi đến chốn; chủ động sửa code phạm vi đã duyệt.
- Không hủy local work, không force push, không sửa chồng Android PR #5, không merge/deploy, không dùng API/key hoặc mua dịch vụ/tiền quảng cáo chưa duyệt.
- Trước khi tuyên bố “xong”, phải có **bằng chứng sử dụng được**: link commit/PR, test logs, Android APK/web bản chạy thật, checklist thao tác người dùng, chỉ số hoặc phản hồi thực tế.
- **Tự báo cáo việc hoàn thành**, không bắt founder gõ lệnh kiểm tra từng dòng, trừ cổng quyền hệ điều hành / tài khoản / thiết bị bắt buộc founder phải thực hiện.

## 8. LỆNH HIỆN TẠI CHO KIRO LEAD — KHÔNG HỎI LẠI TẦM NHÌN

1. Đọc tài liệu này, Blueprint và trạng thái code/branch/PR thực tế. Đặc biệt đối chiếu **P0/P1/P2** và không để PR Council thay thế mục tiêu app.
2. Hoàn tất Issue #13 theo quyền đã cấp: test UI Council trên bản sao riêng, sửa lỗi có chứng cứ; gửi PR nháp; không merge.
3. Song song, lập **báo cáo chênh lệch giữa sản phẩm ZUNVA mong muốn và app v1.5 hiện tại**: mỗi chức năng ghi Đã thấy trong code / Đã kiểm thử chạy / Hỏng / Chưa có / Chưa rõ. Tuyệt đối không tự gắn “hoàn thành”.
4. Đề xuất **đúng một việc P1/P2 nhỏ quan trọng nhất** để biến ZUNVA thành editor tạo sản phẩm thật; gồm tiêu chí kiểm thử end-to-end (mở → tạo bằng mẫu/trang trắng → chỉnh text/ảnh/layer → lưu → mở lại → xuất). Không tự quyết thay founder về các chính sách chưa chốt.
5. Nếu founder đã cho phép thực hiện những sửa lỗi nhỏ trong phạm vi an toàn, triển khai trên nhánh riêng, có bài test, báo kết quả để duyệt. Không yêu cầu founder lập trình.
6. Mỗi lần báo trạng thái ghi 4 nhãn **ĐÃ KIỂM CHỨNG / ĐANG LÀM / BỊ CHẶN / ĐỀ XUẤT**, tối đa hai việc thật sự cần founder hỗ trợ.

## 9. CHƯA CHỐT / KHÔNG TỰ QUYẾT

Chưa chốt stack/backend cuối cùng sau audit, cloud backup provider, chi tiết số lượt và giá Free/Pro, phí giao dịch và cổng thanh toán, quy định giấy phép cộng đồng chi tiết, phạm vi beta đầu tiên, thời điểm đổi package/branding, hoặc lựa chọn mua dịch vụ. Không tự chuyển ý tưởng AI Council về Redis/referral/“giảm 40%” thành roadmap bắt buộc.

**Chốt tinh thần:** Sản phẩm thật trước. Người dùng thật rồi mới tính mở rộng. Founder chỉ muốn xem cái hoạt động và duyệt, không phải điều hành terminal.
