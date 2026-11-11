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

**Lõi vẽ — CHƯA RÕ, chờ Council:** lõi tự viết trong repo (canvas thuần, không thư viện) mới có kéo thả chữ và ảnh, danh sách lớp, hoàn tác; chỉ có phông Arial, chữ một dòng, chưa có tay nắm đổi cỡ, đường căn, xoay, cắt ảnh (Kiro kiểm chứng từ mã). Tay nắm và đường căn mới chỉ có trong bản thử riêng của Claude. Để có xoay, cắt ảnh, sửa chữ trực tiếp, nhóm, Claude đề xuất làm thử cùng một màn hình bằng Fabric.js trong giai đoạn G1, so trên điện thoại thật, rồi mới chọn. Dù chọn bên nào, dữ liệu thiết kế giữ dạng riêng của ZUNVA để đổi lõi sau này không mất dự án.

~~Giữ JavaScript thuần, không chuyển sang React hay Vue.~~ Đã thay bằng đề xuất ở mục **Vòng 2: Chọn nền móng**, sau quyết định của founder ngày 11/11.

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

## Vòng 2: Chọn nền móng

**Founder quyết định (ĐÃ CHỐT, 11/11/2026):** không bắt buộc giữ mã nguồn hiện tại; chọn nền móng tốt nhất cho ZUNVA, kể cả viết lại. Chưa sửa mã cho đến khi các phương án được phản biện và founder duyệt.

**Claude đề xuất phương án C — xây lại nền móng có kiểm soát:** dựng khung mới, mang theo phần đáng giữ, và chuyển dữ liệu cũ sang. Lý do chính: mã hiện tại nhỏ (khoảng 1.500 dòng trong 5 file, đã kiểm chứng), và mọi tính năng 1.0 (phông tiếng Việt, chữ nhiều dòng, xoay, cắt ảnh, nhiều trang, PDF) đều buộc phải viết lại lõi vẽ — giữ lại khung cũ không tiết kiệm được bao nhiêu.

| | A. Giữ nguyên, vá thêm | B. Cải tổ từng phần | C. Xây lại nền móng |
| --- | --- | --- | --- |
| Làm gì | Thêm tính năng vào 5 file JS hiện có | Viết lõi mới cạnh lõi cũ, thay dần từng màn hình | Dựng khung mới, chuyển phần đáng giữ sang |
| Chi phí ban đầu | Thấp nhất | Trung bình | Cao nhất |
| Chi phí về sau | Cao nhất: tính năng nào cũng đụng cả 5 file | Trung bình: nuôi 2 hệ song song | Thấp nhất |
| Nhiều công cụ, 6 nền tảng | Kém: không có mô-đun, Android chỉ nhận 5 file | Được nhưng chậm | Tốt nhất |
| Rủi ro chính | Kẹt kỹ thuật; nhiều AI cùng sửa dễ đụng nhau | Lỗi ở chỗ nối cũ–mới | Mất thời gian đầu trước khi có bản dùng; phải chuyển dữ liệu |
| Chuyển dữ liệu | Không cần | Dễ (cùng app) | Cần bộ nhập dự án cũ (bên dưới) |

Thời gian theo ngày: CHƯA RÕ — phụ thuộc tốc độ của AI và lịch thử của founder; Kiro và GPT ước tính theo từng task.

**Công nghệ đề xuất (ĐỀ XUẤT, chờ phản biện):**

| Phần | Chọn | Vì sao | Phương án thay thế |
| --- | --- | --- | --- |
| Ngôn ngữ | TypeScript | Bắt lỗi sớm khi nhiều AI cùng viết mã | JavaScript thuần |
| Giao diện | React + Vite | Hệ sinh thái lớn nhất, AI viết tốt nhất, nhiều trình chỉnh sửa mẫu để học | Vue, Svelte |
| Lõi vẽ | Konva.js (react-konva) | Có sẵn xoay và đổi cỡ, cảm ứng tốt, hợp với dữ liệu JSON riêng | Fabric.js (có sẵn sửa chữ trực tiếp) — so thử trên S24+ và một máy yếu ở G1 |
| Dữ liệu thiết kế | Mô hình JSON riêng của ZUNVA, có số phiên bản | Đổi lõi vẽ sau này không mất dự án | — |
| Hoàn tác | Ghi từng lệnh thay đổi | Nhẹ, không chụp lại cả thiết kế mỗi lần | Chụp toàn bộ |
| Lưu trên máy | IndexedDB; file `.zunva` nén (JSON + ảnh) | Hết giới hạn 12 dự án, ảnh lưu riêng | — |
| Xuất PDF | pdf-lib | Đúng khổ mm, lề xén | jsPDF |
| Đa ngôn ngữ | i18next, mỗi ngôn ngữ một file | Mang 147 khóa dịch hiện có sang | — |
| Đóng gói | Capacitor (Android, iOS, iPadOS); Tauri 2 (Windows, macOS) | Một bộ mã web cho 6 nền tảng | Flutter (bỏ: viết lại hết, editor trên web yếu) |
| Máy chủ | Chưa cần ở 1.0 | Lưu trên máy, 0 đồng | Sau 1.0: cộng đồng, sao lưu (CHƯA RÕ) |

**Kiến trúc mô-đun:**

- **Lõi (core):** dữ liệu thiết kế, lệnh, lịch sử, lưu trữ. Không phụ thuộc giao diện hay lõi vẽ.
- **Công cụ:** mỗi công cụ là một gói tự khai báo tên, biểu tượng, dùng cho loại lớp nào, hiện ở Phổ thông hay Chuyên nghiệp, và bảng điều khiển của nó. Thêm công cụ = thêm gói, không sửa lõi.
- **AI chọn công cụ:** nhận câu mô tả, trả về công cụ + mẫu + nội dung điền sẵn. Mức 1 hiểu bằng từ khóa trên máy (miễn phí); mức 2 gọi AI bằng khóa của người dùng. Hai mức cùng một đầu ra, nên trang chủ chỉ cần một ô ý tưởng.
- **Vỏ ứng dụng:** web, di động (Capacitor), máy tính (Tauri) chỉ là lớp bọc ngoài.
- **Sau 1.0:** gói video (dòng thời gian), cộng đồng cắm vào cùng lõi.

**Chuyển dữ liệu cũ (bắt buộc trước khi phát hành):**

1. Bộ nhập dự án v1.5 (localStorage) sang định dạng mới, kiểm thử bằng bản lưu thật trên S24+.
2. Android: dữ liệu cũ gắn với địa chỉ `appassets.androidplatform.net` (Kiro kiểm chứng). CHƯA RÕ app mới có giữ được cùng tên gói và cùng địa chỉ để đọc tiếp dữ liệu cũ không — kiểm ở G1. Nếu không được: phát hành bản v1.5.x cuối có nút "Xuất tất cả dự án" trước khi cập nhật.
3. Trong lúc xây, bản v1.5 giữ nguyên để không gián đoạn.

**Mang theo từ mã cũ:** 147 khóa dịch; logic Prompt Studio, Storyboard, Image Toolkit và kết nối AI (viết lại thành mô-đun); cầu nối lưu ảnh vào Thư viện trên Android; `tools/check.js` (chuyển thành bộ kiểm thử); CI và Gemini tự nhận xét PR.

**Ảnh hưởng lộ trình:** G1 đổi thành "Khung mới + lõi vẽ + chuyển dữ liệu"; G2–G5 giữ nguyên.

**Câu hỏi vòng 2 cho GPT, Gemini, Kiro:**

1. Đồng ý phương án C không? Nếu chọn A hoặc B, nêu lý do cụ thể.
2. React + Konva có phải lựa chọn tốt nhất? So với Vue/Svelte và Fabric.js, dẫn chứng.
3. Kiến trúc mô-đun trên còn thiếu gì để sau này thêm video, cộng đồng, nhiều công cụ AI mà không phá hệ thống?
4. Cách chuyển dữ liệu (nhất là Android) có lỗ hổng nào?
5. Ước tính khối lượng G1 mới: danh sách task và credit.

## Định hướng sản phẩm C87 (founder chốt 11/11/2026, tối)

Thương hiệu đã đổi từ ZUNVA sang **C87** (tên trong mã vẫn giữ ZUNVA lúc này), tên gói `vn.c87.lsc`. Mọi phương án ở vòng 2 phải khớp với các nguyên tắc dưới đây.

**1. Quen thuộc như Canva, nhưng là của C87 (ĐÃ CHỐT)**

- Người dùng mở C87 phải thấy dễ dùng và quen tay như khi dùng Canva: màn hình chính rõ việc cần làm, kéo thả, chạm vào chữ để sửa, thanh công cụ quen thuộc. Đây là những thói quen chung của ứng dụng thiết kế, được phép học theo.
- **Logo tuyệt đối không giống Canva.** Màu thương hiệu: hồng pastel hoặc xanh nhạt, không dùng tím. Phông, biểu tượng, tên tính năng, mẫu và hình ảnh do C87 tự làm.
- Bố cục không được giống đến mức đặt cạnh Canva mà người ta nhầm. Cách kiểm tra: người lạ nói "dễ dùng như Canva" là đạt; người lạ hỏi "đây là Canva à?" là không đạt.

**2. Điểm khác biệt: chụp ảnh, quay video kiểu TikTok (ĐÃ CHỐT)**

- Trong C87 có chụp ảnh và quay video ngay trong app, chỉnh sửa được trên **cả Android và iOS**.
- **Ở tầng 1 (bản phát hành đầu), C87 không lưu và không đăng video của người dùng lên máy chủ của mình.** Video được đưa sang các nền tảng khác (TikTok, YouTube, Facebook, Instagram, Zalo…) để người dùng đăng ở đó. Không cần máy chủ video, không tốn phí lưu trữ. Bảng tin video ngay trên C87 thuộc tầng 2 (xem lộ trình 3 tầng bên dưới).

**3. Cách nối với các nền tảng video (ĐỀ XUẤT)**

| Mức | Cách làm | Cần nền tảng duyệt? | Khi nào |
| --- | --- | --- | --- |
| 1 | Nút "Chia sẻ" của hệ điều hành: mở app TikTok/YouTube/Zalo… với video sẵn, người dùng tự bấm đăng | Không (dùng tính năng có sẵn của Android/iOS) — cần kiểm chứng trên máy thật | Ngay từ bản đầu |
| 2 | Đăng thẳng từ C87 qua API chính thức | Có, từng nền tảng | Khi C87 có người dùng thật |

Điều kiện của mức 2 (đã tra tài liệu chính thức ngày 11/11/2026, cần kiểm lại lúc làm):

- TikTok Content Posting API: app chưa qua kiểm duyệt chỉ đăng được ở chế độ riêng tư, tối đa 5 người dùng/24 giờ. TikTok cấm app chèn logo/watermark quảng cáo vào video người dùng — vậy video xuất ra để đăng TikTok không được tự gắn logo C87.
- YouTube Data API: dự án chưa qua kiểm duyệt thì video tải lên bị khóa ở chế độ riêng tư.
- Instagram: người dùng phải có tài khoản chuyên nghiệp; app cần App Review và xác minh doanh nghiệp (CHƯA RÕ: có cần công ty đăng ký pháp nhân không).

**4. Chuẩn bị để hợp tác với nền tảng lớn (ĐỀ XUẤT)**

Khi C87 có nhiều người dùng, các nền tảng sẽ có lợi khi mở đường tích hợp cho C87 (thêm nội dung cho họ). Để có số liệu đi đàm phán, C87 đếm **số lần chia sẻ sang từng nền tảng** ngay từ đầu — chỉ đếm số lượng, không đọc nội dung, không gửi dữ liệu cá nhân.

**5. Tầm nhìn đầy đủ và lộ trình 3 tầng (founder nêu 11/11 tối; chia tầng là ĐỀ XUẤT, founder đồng ý ghi vào đây)**

Tầm nhìn của founder (ĐÃ CHỐT): C87 là nơi người ta mở lên thấy thích thú; có mục tùy chỉnh theo ý mình; ai có ý tưởng mà không biết bắt đầu thì nói bằng một câu (prompt) để nền tảng hiện thực; chụp ảnh, quay video (khi đi du lịch, bằng C87 hay điện thoại), chỉnh rồi đăng lên C87 hoặc qua C87 lên TikTok/YouTube/Facebook; AI giúp viết câu chuyện; lớp học cho người chưa biết chỉnh sửa; công cụ đủ mạnh cho người thiết kế chuyên nghiệp; nơi người có ý tưởng gặp người cần ý tưởng để hợp tác; bán sản phẩm sáng tạo cho nhau; cuộc thi sáng tác; về sau làm cầu nối để công ty tìm người làm việc. AI: bản miễn phí hướng dẫn người dùng dùng khóa API của họ; khi có thu nhập sẽ đầu tư AI của nền tảng và có gói trả phí. Phát hành chính thức khi đã có một nền tảng đủ chức năng để người dùng đánh giá, sau đó nâng cấp theo góp ý.

Nguyên tắc: **tầng sau chỉ xây khi tầng trước đã có người dùng và có tiền.** Nền móng (lõi, mô-đun, dữ liệu) phải chừa sẵn chỗ cho tầng 2 và 3 ngay từ đầu, dù chưa làm.

| Tầng | Gồm | Máy chủ / chi phí | Khi nào |
| --- | --- | --- | --- |
| 1. Công cụ | Trang chủ gợi ý ý tưởng, không bao giờ trống; nói ý tưởng → ra thiết kế; mẫu; chụp, quay, chỉnh ảnh/video; chia sẻ ra nền tảng khác; AI bằng khóa của người dùng + hướng dẫn lấy khóa; lớp học trong app (bài học dạng mẫu, chạy offline); cuộc thi qua hashtag trên TikTok/YouTube | Không cần máy chủ; dữ liệu trên máy người dùng | Bản phát hành chính thức ("hoàn chỉnh" = tầng 1 trọn vẹn, đẹp) |
| 2. Cộng đồng | Tài khoản; bảng tin ảnh/video trên C87; đăng thẳng lên TikTok/YouTube/Facebook (sau khi được duyệt); gói trả phí dùng AI của nền tảng; cuộc thi trên C87 | Cần đám mây (lưu trữ, CPU/GPU thuê); tiền gói trả phí bù chi phí | Khi tầng 1 có người dùng đều đặn |
| 3. Kết nối nghề | Chợ bán mẫu/sản phẩm; ghép người có ý tưởng với người cần ý tưởng; cầu nối công ty – người sáng tạo; lớp học nâng cao | Thanh toán, thuế, pháp lý | Khi đã có thu nhập |

Lý do không làm mạng xã hội ngay từ đầu: lúc chưa có người dùng, bảng tin sẽ trống — đúng cảm giác "vào không biết làm gì" mà founder muốn tránh. Tầng 1 tốt kéo người dùng đến; người dùng lấp đầy tầng 2.

**Câu hỏi thêm cho GPT, Gemini, Kiro (bổ sung vòng 2):**

6. Capacitor có đủ tốt cho camera, quay video và chỉnh video trên cả Android và iOS không? Nếu không, phương án nào (plugin gốc, React Native, Flutter…) và đổi lại mất gì? Dẫn chứng.
7. Chia sẻ video qua nút "Chia sẻ" của hệ điều hành sang TikTok/YouTube/Zalo có bẫy nào (định dạng, dung lượng, iOS)?
8. Kiến trúc mô-đun cần gì để thêm "đăng thẳng" từng nền tảng sau này mà không sửa lõi?
9. Nền móng cần chừa sẵn gì ngay từ G1 để sau này thêm tài khoản, bảng tin, chợ mẫu (tầng 2–3) mà không phải viết lại? Gợi ý cách lưu trữ đám mây rẻ nhất khi đến tầng 2 (ước tính chi phí theo số người dùng).

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
