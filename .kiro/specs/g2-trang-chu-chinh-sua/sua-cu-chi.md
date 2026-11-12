# G2 — Sửa cử chỉ trên trang (founder thử trên S24+, 12/11/2026)

Nguồn: video founder quay 7 phút, APK run 43133194911. Phần lớn chạy tốt (thêm chữ, phông, ảnh, hình, nền, tự lưu, ảnh thu nhỏ). Ba điều founder muốn đổi, cộng một lỗi Claude thấy trong video.

## Founder nói
> "Khung chữ mình phải nhấp nhiều lần mới nhập chữ được. 2 cử chỉ sau: dùng 2 ngón tay để phóng lớn hay thu nhỏ ảnh. Xoay chỉ cần đặt vào góc ảnh để xoay, đặt ngón tay chính giữa để di chuyển, chứ không phải đặt vào vòng mới xoay được."

Video: founder chạm 5 lần vào "Chữ mới" mới vào được ô gõ (chạm 2 lần trên điện thoại khó trúng).

## Yêu cầu (làm trong `zunva/packages/editor-canvas/`)
- [ ] F1 **Sửa chữ bằng 1 lần chạm:** chạm vào lớp chữ **chưa chọn** → chọn. Chạm **1 lần nữa** vào lớp chữ **đang được chọn** (không kéo, < 300 ms, lệch < 10 px) → vào ô gõ ngay, bàn phím hiện. Chạm 2 lần nhanh vẫn được. Thêm vào `DesignCanvasHandle`: `startTextEdit(layerId: Id): void` để app mở ô gõ ngay sau khi bấm "Chữ".
- [ ] F2 **Di chuyển:** 1 ngón đặt giữa lớp rồi kéo → di chuyển (giữ như hiện tại).
- [ ] F3 **Hai ngón khi đang chọn một lớp** (đặt ở bất kỳ đâu trên vùng vẽ) → **phóng to/thu nhỏ và xoay lớp đó** theo hai ngón (như Instagram/Canva), tâm theo trung điểm hai ngón. **Hai ngón khi không chọn lớp nào** → phóng/di chuyển trang như cũ. Cả cử chỉ = **1 bước hoàn tác** (`mergeKey` + `onGestureEnd`). Lớp chữ: phóng thì đổi `fontSize` và khung, **`fontSize` làm tròn số nguyên**. Giới hạn: cạnh ngắn của lớp ≥ 8 px trang.
- [ ] F4 **Tay nắm 4 góc = xoay** lớp quanh tâm (không đổi cỡ). **Bỏ tay nắm xoay hình tròn phía trên.** Vẽ tay nắm góc thành nút tròn có ký hiệu xoay (↻) cho người dùng hiểu. Hút về 0°/90°/180°/270° khi lệch ≤ 5°. Tay nắm **giữa cạnh trái/phải** (và trên/dưới với ảnh, hình) vẫn kéo dãn một chiều; với chữ chỉ đổi bề ngang khung, không đổi cỡ chữ.
- [ ] F5 **Số lẻ:** mọi `updateLayer` phát ra có `fontSize` nguyên, `x/y/width/height` làm tròn 0,1 px, `rotation` làm tròn 0,1° (video thấy cỡ chữ "101.18", "168.75").
- [ ] F6 Vùng chạm tay nắm ≥ 44 px trên màn hình (giữ như hiện tại).
- [ ] F7 Test (Vitest, hàm thuần trong `geometry.ts`): góc xoay từ vị trí ngón so với tâm; biến đổi hai ngón (khoảng cách → tỉ lệ, góc → xoay, trung điểm → vị trí) cho lớp có xoay sẵn; làm tròn F5; hút góc F4; phân biệt chạm/kéo F1.

## Không đổi
Hợp đồng `DesignCanvasProps` giữ nguyên (chỉ thêm `startTextEdit` vào handle). Không sửa ngoài `zunva/packages/editor-canvas/`. Phía app (Claude): làm tròn số cỡ chữ hiển thị, gọi `startTextEdit` sau khi thêm chữ, đổi chữ hướng dẫn.
