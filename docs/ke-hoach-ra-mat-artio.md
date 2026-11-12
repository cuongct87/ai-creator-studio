# Kế hoạch ra mắt và vận hành Artio

Viết ngày 12/11/2026 theo yêu cầu founder: "lưu lại, tới giai đoạn đó hỗ trợ mình". **Chưa làm**: chỉ bắt đầu khi app đã hoàn thiện, bảo mật đầy đủ, chạy được trên Android và iOS (founder không công bố trước lúc đó).

## 1. Trước khi lên kho ứng dụng
- [ ] Tài khoản Google Play Console (phí một lần) và Apple Developer (~99 USD/năm). **Khoản trả phí — hỏi founder trước.**
- [ ] Google Play, tài khoản cá nhân mới: **≥ 12 người cài thử liên tục 14 ngày** mới được phát hành chính thức (còn áp dụng 2026 — [Google](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)). Founder gom sẵn 12–15 người dùng Android.
- [ ] Chính sách quyền riêng tư (cả hai kho bắt buộc) + mục "An toàn dữ liệu" của Google Play. Artio lưu trên máy, không thu dữ liệu → nội dung gọn. Claude soạn.
- [ ] Hộ kinh doanh hoặc công ty khi bắt đầu thu tiền (hỏi kế toán về thuế).
- [ ] Đăng ký nhãn hiệu "Artio" tại Cục Sở hữu trí tuệ trước khi quảng bá. Lưu ý: App Store đã có app "Artio – ART" (sưu tầm tranh) → tên trên kho nên ghép, ví dụ "Artio: Thiết kế & Thiệp".
- [ ] Chốt tên gói Android (hiện `vn.c87.lsc`, không đổi được sau khi lên Google Play) cùng tên miền `.com`/`.net`; trang web đơn giản có chính sách quyền riêng tư.

## 2. Kiếm tiền (miễn phí cơ bản + Pro)
- Miễn phí: thiết kế, lưu dự án, xuất ảnh thường.
- Pro (tháng/năm): mẫu cao cấp, xuất nét để in / PDF, bỏ chữ "Artio" trên ảnh, phông đặc biệt. AI: người dùng tự gắn khóa AI của mình (miễn phí) hoặc gói AI trả phí sau.
- Thu qua thanh toán trong app của Google/Apple (thường giữ 15% với nhà phát triển nhỏ).

## 3. Khách đầu tiên
- Lợi thế: thứ Canva chưa sát người Việt — thiệp cưới kiểu Việt, cáo phó, bảng hiệu tiệm nhỏ, bài bán hàng Zalo/Facebook.
- Video ngắn TikTok/Facebook: "Làm thiệp cưới đẹp trong 2 phút bằng điện thoại".
- Người làm nghề: tiệm in thiệp, dịch vụ cưới hỏi, làm bảng hiệu — tặng Pro để giới thiệu khách.
- Từ khóa tiếng Việt trên kho (ASO): "làm thiệp cưới", "thiết kế bảng hiệu", "mẫu cáo phó"…

## 4. Vận hành khi có người dùng
- Báo lỗi sập app tự động (Firebase Crashlytics, miễn phí).
- Trả lời mọi đánh giá trên kho, nhất là 1–2 sao. Một kênh hỗ trợ: Zalo OA hoặc fanpage.
- Cập nhật 2–4 tuần/lần theo góp ý thật.
- Theo dõi tỉ lệ người quay lại sau 1 / 7 / 30 ngày (quan trọng hơn lượt tải).

## 5. Bài học từ người đi trước
1. Ra mắt sớm phạm vi nhỏ, sửa theo khách.
2. Lắng nghe kỹ 10 người dùng đầu.
3. Bản quyền: mẫu, ảnh, phông tự làm hoặc có giấy phép rõ.
4. Chi phí cố định thấp (Artio lưu trên máy); AI tốn tiền → thu riêng.
5. Sao lưu khóa ký (đã làm 11/11/2026).

## 6. Hình ảnh và đồ họa
Founder muốn **Gemini hỗ trợ làm hình ảnh/đồ họa** (mẫu thiệp, biểu tượng, ảnh giới thiệu trên kho, video quảng bá). Claude viết mô tả chi tiết (kích thước, màu Artio, nội dung, chỗ để chữ) để Gemini làm theo. Lưu ý:
- Không bắt chước logo, nhân vật, mẫu của Canva hay thương hiệu khác.
- Ảnh do AI tạo vẫn kiểm tra kỹ chữ tiếng Việt (AI hay viết sai dấu) — chữ trên mẫu nên để Artio vẽ bằng phông thật, AI chỉ làm hình nền/hoa văn.
- Nếu cần gọi dịch vụ tạo ảnh trả phí qua API: hỏi founder trước.
