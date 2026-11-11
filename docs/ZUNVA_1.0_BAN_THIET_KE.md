# Bản thiết kế ZUNVA 1.0

11/11/2026 · Founder: Cường · Bản nháp vòng 1 do Claude viết

ZUNVA 1.0 là bản phát hành đầu tiên dùng thật: mở lên là biết làm gì, làm xong một thiết kế đẹp trong vài phút, chạy trên Web, Android, iOS, iPadOS, Windows và macOS từ cùng một bộ mã. Đây là bản nháp vòng 1 do Claude viết, làm đề bài chung để GPT, Gemini và Kiro phản biện.

## Phiếu Council

| Mục | Nội dung |
| --- | --- |
| Mã việc | ZAC-20261111-001 |
| Trạng thái | REVIEW_PENDING (chờ phản biện), chưa được founder duyệt |
| Người viết vòng 1 | Claude |
| Cách chuyển | Thủ công qua founder, hoặc GitHub khi Claude có quyền ghi |
| Ràng buộc | Không push main, không merge, không deploy, không dịch vụ trả phí khi chưa duyệt, không lộ khóa API |
| Trần credit Kiro đề xuất | 300 credit cho vòng thiết kế |

**Yêu cầu của founder (nguyên văn, 11/11/2026):**

> Mong sản phẩm không phải chỉ là bản dùng thử chỉnh từ từ, mình cần bản hoàn thiện tất cả các chức năng đơn giản như Canva, chỉ cần mở lên ở trang chủ mình nhìn vào là biết phải làm gì, muốn nghĩ ra ý tưởng gì. Mong muốn khi phát triển sẽ ra nhiều bản cài cho Win, macOS, iPadOS, iOS, web.

**Cách đọc:** mỗi mục ghi rõ **ĐÃ CHỐT** (founder đã nói), **ĐỀ XUẤT** (Claude đề nghị, chờ duyệt) hoặc **CHƯA RÕ**. Ý kiến của GPT, Gemini, Kiro chỉ được thêm khi họ thật sự trả lời, kèm cách chuyển.

## Người dùng và hành trình chính

Bản 1.0 đạt khi cả 4 hành trình dưới đây chạy trọn vẹn trên mỗi nền tảng, không cần khóa AI, không cần tài khoản. Người dùng mục tiêu (ĐÃ CHỐT trong tài liệu tầm nhìn): người bán hàng nhỏ, tiệm in quảng cáo/đám cưới/đám tang, người làm nội dung mạng xã hội, người mới không giỏi thiết kế.

| Hành trình | Các bước | Đạt khi |
| --- | --- | --- |
| Bán hàng | Mở app → chọn mẫu bài bán hàng → thay ảnh, tên, giá → xuất ảnh → chia sẻ | Người mới làm xong dưới 3 phút |
| Tiệm in | Chọn thiệp cưới hoặc bảng hiệu → nhập khổ theo cm → chỉnh → xuất PDF in → lưu, mở lại sửa tiếp | File đúng khổ, đủ nét ở 300 DPI |
| Ý tưởng | Gõ "thiệp cưới cho Hùng và Lan ngày 20/12" → ZUNVA đưa 3 thiết kế đã điền sẵn → chọn một → sửa | Hoạt động cả khi không có khóa AI |
| Trở lại | Mở app hôm sau → thấy thiết kế dở ngay đầu trang → sửa tiếp | Không mất lớp, ảnh, phông |

## Trang chủ và điều hướng

Trang chủ chỉ có một việc: đưa người dùng vào trình chỉnh sửa trong một lần chạm. Ba cửa vào (ĐÃ CHỐT): Tạo bằng AI, Khám phá mẫu, Trang trắng — cả ba dẫn về cùng một trình chỉnh sửa.

Thứ tự từ trên xuống (ĐỀ XUẤT, đã thử trong bản thử):

1. Logo ZUNVA, nút đổi Phổ thông / Chuyên nghiệp.
2. Câu hỏi lớn "Bạn muốn tạo gì hôm nay?" + ô nhập ý tưởng + vài câu ví dụ bấm là chạy.
3. Tiếp tục thiết kế: các bản đang làm dở.
4. Bắt đầu tại đây: nút tròn theo việc cần làm — Thiệp cưới, Cáo phó, Bảng hiệu, Bài bán hàng, Mạng xã hội, Thực đơn, Trang trắng, Khổ tùy chọn.
5. Mẫu dành cho bạn: một hàng mẫu, "Xem tất cả" sang tab Mẫu.

Thanh dưới cố định (ĐÃ CHỐT trong đặc tả P3): **Trang chủ · Dự án · Mẫu · AI · Tài khoản**. Trên máy tính và iPad, thanh này thành cột trái.

| Tab | Bản 1.0 có |
| --- | --- |
| Dự án | Tìm kiếm, lọc theo loại, đổi tên, nhân bản, xóa vào Thùng rác (giữ 30 ngày), xuất/nhập file dự án |
| Mẫu | Nhóm theo việc, tìm kiếm, xem trước, "Dùng mẫu này" |
| AI | Prompt Studio, Storyboard, Công cụ ảnh đang có + kết nối khóa AI của người dùng |
| Tài khoản | Ngôn ngữ (5 tiếng), giao diện Sáng/Tối/Theo máy, sao lưu, khóa AI |

Không hiện bất kỳ nút nào cho tính năng chưa làm (ĐÃ CHỐT). Không dùng màu, biểu tượng, tên của Canva.

## Trình chỉnh sửa

Một trình chỉnh sửa, hai chế độ dùng chung dữ liệu (ĐÃ CHỐT). Phổ thông chỉ hiện công cụ hay dùng; Chuyên nghiệp hiện thêm thông số. Thanh công cụ đổi theo vật đang chọn: chạm chữ thì hiện phông, cỡ, màu; chạm ảnh thì hiện cắt, lọc, xóa nền.

Bố cục: điện thoại = trang ở giữa, thanh công cụ dưới đáy. Máy tính và iPad = 4 vùng: cột trái (Thêm, Mẫu, Ảnh, Lớp), trang ở giữa, thanh ngữ cảnh phía trên, cột phải chỉnh chi tiết.

| Nhóm | Chức năng bản 1.0 | Phổ thông | Chuyên nghiệp |
| --- | --- | --- | --- |
| Chữ | Thêm tiêu đề/đoạn, sửa trực tiếp trên trang, phông tiếng Việt, cỡ, màu, căn lề, đậm/nghiêng | Có | Có |
| Chữ nâng cao | Giãn dòng, giãn chữ, viền chữ, bóng, chữ cong | — | Có |
| Ảnh | Thêm từ máy, thay ảnh, cắt (crop), lật, bộ lọc, độ sáng/tương phản | Có | Có |
| Ảnh nâng cao | Khung ảnh (kéo ảnh vào khung tròn/vuông), xóa nền bằng AI (cần khóa) | Khung ảnh | Có |
| Nền | Màu, ảnh nền, độ rõ ảnh nền, màu chuyển | Có | Có |
| Hình | Chữ nhật, tròn, đường kẻ, mũi tên, ngôi sao, họa tiết trang trí | Có | Có |
| Thao tác | Kéo, đổi cỡ, xoay, nhân bản, xóa, khóa, đường căn tự động | Có | Có |
| Sắp xếp | Lớp (ẩn, khóa, kéo đổi thứ tự), nhóm/bỏ nhóm, căn và dàn đều nhiều vật, vị trí theo số | — | Có |
| Trang | Nhiều trang, đổi khổ (px, mm, cm), lề an toàn và lề xén khi in | Nhiều trang | Có |
| Lịch sử | Hoàn tác/làm lại, tự lưu | Có | Có |
| Phím tắt | Ctrl/Cmd+Z, Delete, mũi tên, Ctrl+D, Ctrl+G | Máy tính | Máy tính |

Chưa làm ở 1.0 (ĐỀ XUẤT): chỉnh sửa cùng lúc nhiều người, hoạt hình, video, nhập file Photoshop.

## Kho mẫu và AI

Bản 1.0 cần khoảng 60 mẫu tự làm, mỗi mẫu có chữ mẫu riêng cho từng ngôn ngữ (ĐÃ CHỐT: mỗi ngôn ngữ có chữ mẫu riêng). Con số 60 là ĐỀ XUẤT.

| Nhóm mẫu | Số mẫu đề xuất | Khổ chính |
| --- | --- | --- |
| Thiệp cưới, thiệp mời | 12 | 10×15 cm, 1080×1350 |
| Cáo phó, phân ưu | 6 | A4, A5 |
| Bảng hiệu, banner | 10 | Theo cm, tỉ lệ 2:1, 3:1 |
| Bài bán hàng, khuyến mãi | 12 | 1080×1080, 1080×1350 |
| Mạng xã hội, story, ảnh bìa | 12 | 1080×1920, 1640×624 |
| Thực đơn, bảng giá, tờ rơi | 8 | A4, A5 |

Mẫu là dữ liệu (file JSON), không phải ảnh phẳng: thêm mẫu không cần sửa mã. Ảnh trong mẫu phải tự tạo hoặc có giấy phép dùng thương mại.

**AI có hai mức (ĐÃ CHỐT: không có khóa vẫn dùng được, BYOK không bị khóa sau gói Pro):**

- **Không cần khóa:** ô ý tưởng hiểu bằng từ khóa ngay trên máy, nhận ra loại thiết kế, tên, ngày, số điện thoại, % giảm, rồi điền sẵn vào 3 mẫu hợp nhất. Đã chạy trong bản thử.
- **Có khóa của người dùng (Gemini, OpenAI, Claude, DeepSeek):** viết lại nội dung, gợi ý câu chữ, tạo ảnh, xóa nền, dịch thiết kế sang ngôn ngữ khác. Người dùng luôn tự bấm tạo; trước khi gọi có ghi sẽ tốn phí.

Cả hai mức trả về cùng một dạng kết quả (loại thiết kế + nội dung cần điền), nên đổi nhà cung cấp AI không phải sửa trình chỉnh sửa. Khóa AI chỉ lưu trên máy người dùng, không gửi về ZUNVA.

## Dữ liệu, lưu và xuất file

Thiết kế lưu trên máy người dùng trước tiên (ĐÃ CHỐT: local-first), không cần máy chủ ZUNVA để mở và sửa tiếp.

- **Dạng lưu:** mỗi thiết kế = danh sách trang, mỗi trang = danh sách lớp (chữ, ảnh, hình), có số phiên bản. Ảnh lưu riêng một chỗ, không chép lại mỗi lần sửa. Bản lưu cũ của v1.5 vẫn mở được.
- **Nơi lưu:** bộ nhớ trong của trình duyệt (IndexedDB) trên web; thư mục của app trên bản cài. Không còn giới hạn 12 dự án như hiện nay.
- **Tự lưu:** gom thay đổi, lưu sau khi người dùng dừng tay khoảng 1 giây; có chữ "Đã lưu" / "Chưa lưu được" rõ ràng.
- **File dự án `.zunva`:** một file chứa cả bố cục và ảnh, dùng để sao lưu, chuyển máy, gửi cho tiệm in.
- **Sao lưu đám mây** (Google Drive, OneDrive): CHƯA RÕ, để sau 1.0.

| Xuất ra | Dùng cho | Ghi chú |
| --- | --- | --- |
| PNG, JPG | Mạng xã hội, Zalo | Chọn cỡ 1×, 2× |
| PDF in | Tiệm in | Đúng khổ mm/cm, 300 DPI, có lề xén 3 mm |
| PDF nhiều trang | Thực đơn, tờ rơi | Mỗi trang thiết kế = một trang PDF |
| Chia sẻ thẳng | Zalo, Facebook, tin nhắn | Bảng chia sẻ của hệ điều hành (Android, iOS) |

PDF chuẩn CMYK cho in offset chưa có ở 1.0 (ĐỀ XUẤT); tiệm in kỹ thuật số dùng PDF RGB được.

## Bản cài cho từng nền tảng

Một bộ mã web duy nhất, đóng gói thành 6 bản (ĐỀ XUẤT). Founder muốn có Web, Windows, macOS, iOS, iPadOS (ĐÃ CHỐT 11/11); Android đã có sẵn.

| Nền tảng | Cách đóng gói (ĐỀ XUẤT) | Cần gì | Chi phí |
| --- | --- | --- | --- |
| Web | Chạy trên trình duyệt, cài được lên màn hình như app (PWA) | Một chỗ đăng web tĩnh | Có chỗ miễn phí (GitHub Pages) |
| Android | Capacitor (thay WebView tự viết hiện nay) | Đã có bước build APK | Google Play: phí một lần khi lên chợ |
| iOS, iPadOS | Capacitor | Máy Mac hoặc máy Mac thuê trên mây để build; tài khoản Apple Developer | Khoảng 99 USD/năm |
| Windows | Tauri (app nhẹ, vài MB) | Build tự động trên GitHub | Miễn phí; ký số để hết cảnh báo Windows thì tốn phí |
| macOS | Tauri | Cùng tài khoản Apple phía trên để ký app | Đã tính ở dòng iOS |

Thứ tự ra bản đề xuất: Web và Android trước (không tốn phí), Windows tiếp theo, iOS/iPadOS/macOS khi founder duyệt phí Apple. Giao diện tự đổi theo màn hình: điện thoại 1 cột, iPad và máy tính 4 vùng. Mọi bản dùng chung file `.zunva`, nên làm trên điện thoại rồi mở tiếp trên máy tính được.

## Kiến trúc kỹ thuật

Mọi nền tảng dùng chung một lõi thiết kế viết một lần; chỉ tầng đóng gói khác nhau (ĐỀ XUẤT). Mỗi công cụ là một mô-đun tự khai báo nó dùng cho chữ, ảnh hay hình, và hiện ở chế độ nào — thêm công cụ không phải sửa bộ khung. Bản thử đã chạy được cách này.

Sơ đồ 4 tầng (từ trên xuống, tầng trên gọi xuống tầng dưới):

1. **Giao diện** (tự đổi theo màn hình): Trang chủ · Dự án · Mẫu · AI · Tài khoản · Trình chỉnh sửa
2. **Lõi thiết kế** (viết một lần): Dữ liệu trang + lớp · Bộ vẽ · Hoàn tác + tự lưu · Công cụ dạng mô-đun
3. **Dịch vụ chạy trên máy người dùng**: Hiểu ý tưởng (từ khóa / AI của bạn) · Lưu trữ + file .zunva · Xuất PNG, JPG, PDF
4. **Đóng gói thành bản cài**: Web (PWA) · Capacitor (Android, iOS, iPadOS) · Tauri (Windows, macOS)

**Lõi vẽ — CHƯA RÕ, chờ Council:** lõi tự viết hiện tại (canvas thuần, không thư viện) đã làm được kéo thả, đổi cỡ, đường căn, lớp, hoàn tác. Để có xoay, cắt ảnh, sửa chữ trực tiếp, nhóm, Claude đề xuất làm thử cùng một màn hình bằng Fabric.js trong giai đoạn G1, so trên điện thoại thật, rồi mới chọn. Dù chọn bên nào, dữ liệu thiết kế giữ dạng riêng của ZUNVA để đổi lõi sau này không mất dự án.

Giữ JavaScript thuần như hiện nay, thêm công cụ build nhẹ (Vite) để chia mã thành nhiều file. Không chuyển sang React hay Vue (ĐỀ XUẤT, khớp quyết định cũ: không viết lại từ đầu).

## Lộ trình và nghiệm thu

Năm giai đoạn G1–G5 (ĐỀ XUẤT), mỗi giai đoạn kết thúc bằng một bản chạy thật founder tự thử, không phải bản thử rời rạc. G2 là cột sống của sản phẩm, khớp với P2 trong tài liệu tầm nhìn.

| Giai đoạn | Làm gì | Cổng để qua |
| --- | --- | --- |
| G1 · Nền móng | Dữ liệu trang + lớp, lưu bền trên máy; file .zunva, mở được bản lưu cũ v1.5; thử Fabric.js cạnh lõi tự viết | Lưu, thoát, mở lại không mất gì; chọn được lõi vẽ |
| G2 · Trình chỉnh sửa | Toàn bộ chức năng trong bảng ở trên; Phổ thông + Chuyên nghiệp; bố cục 4 vùng cho máy tính và iPad | Founder tự làm xong 4 hành trình trên điện thoại thật |
| G3 · Mẫu, ý tưởng, xuất | 60 mẫu, ô ý tưởng, AI dùng khóa của bạn; PDF in đúng khổ mm/cm; đủ 5 ngôn ngữ | Tiệm in nhận file và in đúng khổ |
| G4 · Bản cài đợt 1 | Web (PWA), Android, Windows; nhóm nhỏ người dùng thật dùng thử | Cài và chạy ổn trên cả 3 nền tảng |
| G5 · Bản cài Apple | iOS, iPadOS, macOS; đưa lên App Store | Founder duyệt phí Apple trước khi làm |

Chưa ghi thời gian cho từng giai đoạn: Kiro sẽ ước tính khi chia task (đề bài số 6 bên dưới). Tiêu chí chung cho mọi giai đoạn: chạy trên điện thoại thật của founder, không nút chết, không mất dữ liệu khi đổi ngôn ngữ, báo test kèm lệnh và kết quả, PR riêng chờ founder duyệt.

## Đề bài phản biện cho GPT, Gemini, Kiro

Mỗi AI đọc toàn bộ tài liệu này và trả lời độc lập, chưa xem ý kiến của bên khác. Trả lời theo mẫu của Giao thức Council: lập trường, dẫn chứng, rủi ro, ước tính chi phí, mức tự tin, điều chưa biết.

1. Danh sách chức năng 1.0 thiếu gì quan trọng với người bán hàng và tiệm in Việt Nam? Thừa gì nên bỏ?
2. Lõi vẽ: giữ lõi tự viết hay chuyển sang Fabric.js / Konva.js? Nêu bằng chứng cụ thể (xoay, cắt ảnh, sửa chữ trực tiếp, cảm ứng trên điện thoại yếu).
3. Capacitor + Tauri có phải lựa chọn đúng cho 6 nền tảng với ngân sách thấp không? Có bẫy nào với phông tiếng Việt, lưu file, chia sẻ trên iOS?
4. 60 mẫu tự làm có khả thi không? Ai làm, mất bao lâu, nguồn ảnh và phông hợp pháp?
5. Lộ trình và tiêu chí nghiệm thu có đo được không? Giai đoạn nào rủi ro nhất?
6. Riêng Kiro: chia giai đoạn G1 thành các task spec, ước tính credit cho mỗi task. Chưa viết mã.

## Việc chờ founder chốt

- [ ] Duyệt danh sách chức năng 1.0 (mục Trình chỉnh sửa) hoặc ghi phần muốn thêm/bớt
- [ ] Thứ tự ra bản cài: Web + Android trước, rồi Windows, rồi Apple — đồng ý hay đổi?
- [ ] Phí Apple Developer (khoảng 99 USD/năm): chấp nhận khi đến giai đoạn G5?
- [ ] Ai làm 60 mẫu: AI tự làm rồi founder duyệt, hay founder có mẫu sẵn từ tiệm in?
- [ ] Cài Claude GitHub App cho kho ai-creator-studio (Claude ghi được Issue/nhánh, không đụng main)
- [ ] Nối cuộc trò chuyện với laptop qua ứng dụng Claude để Claude giao việc thẳng cho Kiro
- [ ] Trần credit Kiro cho vòng này: 300 credit, hay mức khác?
- [ ] File Master Blueprint 06/11 (để đặt tên giai đoạn không trùng P0–P8 cũ)
