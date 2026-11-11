# G1 — Nền móng ZUNVA mới: Tasks

Luật chung cho mọi task:
- Mỗi task: **một phiên Kiro mới**, một nhánh, **một PR riêng** vào `main`, không merge (founder merge).
- Đầu báo cáo ghi **credit ước tính**; cuối báo cáo ghi **credit thật** (Est. Credits Used). Vượt 50% dự toán → dừng, báo founder.
- Báo cáo bằng tiếng Việt dễ hiểu: đã đổi gì, lệnh đã chạy và kết quả, việc chưa làm.
- Không đưa khóa, mật khẩu, keystore vào repo, log, PR hay chat.

## G1-0 — Founder tự kiểm (0 credit) — XONG (founder trả lời 11/11/2026)
- [x] Có mấy app AI Creator Studio / ZUNVA trên S24+: **chỉ 1 app ZUNVA**.
- [x] Có dự án nào cần giữ không: **không cần giữ dự án nào**.
- [x] Bấm "Xuất dự án JSON": **có ra file trong Tải xuống**.

Hệ quả: không cần cầu nối `AndroidFileSaver` (đã bỏ bước 1.4). Phần nhập dự án v1.5 ở G1-7 hạ xuống **ưu tiên thấp**.

## G1-2 — Khung repo mới — XONG (Claude, PR #32, 0 credit Kiro)
Nhánh: `feat/g1-2-khung-zunva`
- [x] 2.1 Tạo `zunva/` với pnpm workspace, `tsconfig.base.json` strict, ghim phiên bản chính xác.
- [x] 2.2 Tạo `packages/core` (một hàm mẫu + 1 test Vitest), `packages/platform` (chỉ khai báo interface), `packages/tools` (README).
- [x] 2.3 Tạo `apps/web` (Vite + React) với trang chủ khung theo R2.5.
- [x] 2.4 ESLint + luật hướng phụ thuộc (design.md). Chạy thử vi phạm rồi bỏ.
- [x] 2.5 Playwright 360×780: 5 tab hiện đủ, không cuộn ngang.
- [x] 2.6 `.github/workflows/zunva-ci.yml` theo R2.7.
- [x] 2.7 Kiểm tra tiêu chí đạt G1-2, mở PR, báo cáo.

## G1-1 — Khóa ký và tên gói — XONG (Kiro PR #38 + founder, 11/11/2026)
Nhánh: `feat/g1-1-khoa-ky` · Tên gói chính thức: **`vn.c87.lsc`** (founder chốt 11/11/2026)
- [x] 1.1 Hướng dẫn founder từng lệnh `keytool` để tạo keystore **trên máy founder**, cách mã hóa base64 và dán 4 secret vào GitHub. Kiro không tự đọc hay in mật khẩu.
- [x] 1.2 Workflow `android-release-apk.yml` (chỉ `workflow_dispatch`): giải mã keystore từ secret, build release với tên gói đã chốt, ký, xuất artifact, xóa file khóa tạm.
- [x] 1.3 Chạy workflow 2 lần, so chứng chỉ SHA-256 hai APK.
- [x] 1.5 Kiểm tra tiêu chí đạt G1-1, mở PR, báo cáo.
- Kết quả: founder tạo khóa trên laptop (khóa đầu bị lộ mật khẩu qua ảnh chụp nên đã xóa, tạo khóa mới), dán 4 secret. Workflow chạy 2 lần (run 43005813040, 43006002470): cùng chứng chỉ SHA-256 `248a14eb9e9d61506577db351cae910d22a2800465e557a845c3828e03e61bbf`, tên gói `vn.c87.lsc`. APK cài được trên S24+ (mở ra báo thiếu `index.html` — đúng dự kiến, vì `main` chưa đóng gói giao diện; G1-7 xử lý).

## Chia việc song song (founder chốt 11/11 13:33)
Credit Kiro hết hạn sau 2 tháng nên Kiro và Claude chạy song song, mỗi bên một thư mục, không sửa file của nhau. Chỉ `zunva/pnpm-lock.yaml` có thể xung đột: bên merge sau chạy lại `pnpm install` để tạo lại file khóa.

| Task | Người làm | Thư mục được sửa |
| --- | --- | --- |
| G1-3 Lõi dữ liệu + hoàn tác | Claude | `zunva/packages/core/` |
| G1-4 Thử lõi vẽ Konva trên điện thoại thật | Kiro (chạy trên laptop founder, cùng Wi-Fi với S24+) | `zunva/apps/poc-konva/` (mới) |

## G1-3 — Lõi dữ liệu v2 và hoàn tác theo lệnh (Claude) — XONG (PR #35, #36)
Nhánh: `feat/g1-3-core-data`
- [x] 3.1 Mô hình `Document → Page → Layer` (chữ, ảnh, hình) và `Asset`; mỗi phần tử có ID cố định; `schemaVersion: 2`; trang có `duration`, lớp có `timing`/`animation` để trống (chỗ cho video sau 1.0).
- [x] 3.2 Kiểm tra dữ liệu (viết tay, không dùng zod): dữ liệu sai bị từ chối kèm lý do.
- [x] 3.3 Lệnh (command) thêm/sửa/xóa/sắp lớp; giao dịch gộp nhiều thay đổi thành một bước hoàn tác (ví dụ kéo một vật).
- [x] 3.4 Lịch sử hoàn tác/làm lại theo lệnh, không chụp cả thiết kế.
- [x] 3.5 Test: 100 thao tác ngẫu nhiên rồi hoàn tác hết → về đúng trạng thái đầu; làm lại hết → về đúng trạng thái cuối.
- Đạt: CI xanh; lõi vẫn qua luật không gọi React/DOM.

## G1-4 — Thử lõi vẽ Konva trên S24+ (Kiro) — XONG, ĐẠT (PR #37)
Nhánh: `feat/g1-4-poc-konva`. Ứng dụng thử **độc lập** `zunva/apps/poc-konva` (Vite + React + `react-konva` + `konva`, cài bằng `pnpm add -E`). Không import code chưa có của `@zunva/core`; không sửa gói khác.
- [x] 4.1 Một trang 1080×1350 (có nút đổi sang 1748×2480), 30 vật: chữ nhiều dòng tiếng Việt, hình, 2 ảnh lớn (≥ 3000 px, tự tạo bằng canvas, không lấy ảnh có bản quyền).
- [x] 4.2 Phông Việt đi kèm app, giấy phép OFL (ví dụ `@fontsource/be-vietnam-pro`, `@fontsource/playfair-display`); chờ phông tải xong mới vẽ.
- [x] 4.3 Chọn vật; kéo, xoay, đổi cỡ bằng `Transformer`; chụm hai ngón để phóng to/thu nhỏ trang.
- [x] 4.4 Sửa chữ trực tiếp: chạm hai lần vào chữ → hiện ô `textarea` đúng vị trí, gõ xong cập nhật chữ.
- [x] 4.5 Cắt ảnh cơ bản (khung cắt), nhóm 2 vật, hoàn tác đơn giản (trong bản thử được chụp cả trang).
- [x] 4.6 Đồng hồ FPS hiện trên màn hình; nút "Xuất PNG".
- [x] 4.7 Chạy `pnpm --filter @zunva/poc-konva dev --host`, founder mở trên S24+ bằng địa chỉ IP của laptop (cùng Wi-Fi; cho phép tường lửa Windows ở mạng riêng).
- [x] 4.8 Founder thử và Kiro ghi bảng kết quả trong PR: FPS khi kéo (S24+ và một máy yếu nếu có), gõ Telex và VNI bằng Gboard/Laban Key có lỗi dấu không, có treo/giật không, dung lượng bản build.
- Đạt: kéo ≥ 30 FPS trên S24+, gõ Telex không lỗi dấu, không treo. Nếu trượt: báo founder, chưa thử Fabric khi founder chưa duyệt.
- Kết quả (founder thử 11/11): FPS thấp nhất khi kéo 66 (khổ 1080×1350) và 72 (khổ 1748×2480); gõ Gboard tiếng Việt đúng dấu; không treo. **Chọn Konva làm lõi vẽ.** Ghi lại cho bản thật: giữ nội dung khi đổi khổ; xuất PNG theo khung trang, không theo màn hình; đồng hồ FPS ghi mọi khoảng có thao tác; nút "Xong" không bị che mép phải.

## Chia việc song song vòng 2 (founder duyệt 11/11/2026 17:54)
| Task | Người làm | Thư mục được sửa |
| --- | --- | --- |
| G1-5 Lưu dự án trên máy + lớp nền tảng web | Kiro | `zunva/packages/platform/`, `zunva/apps/web/`, `zunva/pnpm-lock.yaml` |
| G1-6 File `.zunva` | Claude | `zunva/packages/core/` |

Hai bên không sửa thư mục của nhau. G1-5 chỉ **dùng** `@zunva/core` (kiểu dữ liệu, `validateDocument`), không sửa nó.

## G1-5 — Lưu dự án trên máy + lớp nền tảng web (Kiro) — XONG (PR #41)
Nhánh: `feat/g1-5-luu-tru`. Thay localStorage của v1.5 (tối đa 12 dự án, ảnh base64 nằm trong dự án) bằng IndexedDB: không giới hạn số dự án, ảnh lưu riêng.
- [x] 5.1 Trong `packages/platform/src/index.ts` thêm interface `ProjectStore`:
  - `list(): Promise<PlatformResult<ProjectSummary[]>>` — `ProjectSummary = { id, name, updatedAt, pageCount }`, mới sửa xếp trước.
  - `load(id)`, `save(doc)`, `remove(id)` (xóa cả ảnh không còn dự án nào dùng).
  - `putAsset(id, mimeType, bytes)`, `getAsset(id)` → `{ mimeType, bytes }`.
  - Ảnh **không** nằm trong JSON dự án (khác v1.5).
- [x] 5.2 Bản cài đặt `createIndexedDbProjectStore(dbName = 'c87')` dùng **API IndexedDB gốc, không thêm thư viện**: kho `projects` và `assets`; mỗi lần lưu là một giao dịch. Chạy `validateDocument` **trước khi lưu và sau khi đọc**: dữ liệu sai thì trả `{ ok: false, error }` tiếng Việt dễ hiểu, không làm sập app. `updatedAt` do kho ghi (nhận đồng hồ `now: () => number` qua tham số để test được).
- [x] 5.3 Lưu bền: lần đầu gọi `navigator.storage.persist()`; hàm `storageInfo()` trả dung lượng đã dùng/còn (`navigator.storage.estimate()`); hết chỗ (`QuotaExceededError`) → lỗi "Máy hết chỗ lưu…".
- [x] 5.4 `createWebPlatform()`: `FileSaver` (Blob + thẻ `a` tải xuống), `ImagePicker` (`input type=file accept=image/*`), `GallerySaver` (trên web = tải xuống).
- [x] 5.5 Tab **Dự án** trong `apps/web`: danh sách (tên, ngày sửa), nút "Tạo dự án mới" (trang trắng 1080×1350), đổi tên, xóa (hỏi lại trước khi xóa). Chưa cần trình chỉnh sửa. Chữ tiếng Việt, khổ 360×780 không cuộn ngang.
- [x] 5.6 `createAutosave(store, delayMs = 800)`: gom nhiều thay đổi liên tiếp thành một lần ghi; lưu ngay khi trang bị ẩn (`visibilitychange`).
- [x] 5.7 Test: Vitest + `fake-indexeddb` (`pnpm add -D -E`) cho `ProjectStore` (lưu → đọc giống hệt; xóa; tài liệu sai bị từ chối; 200 dự án; ảnh dùng chung không bị xóa nhầm); test autosave bằng đồng hồ giả. Playwright 360×780: tạo dự án → tải lại trang → vẫn còn; xóa → mất.
- [x] 5.8 Kiểm tra tiêu chí, mở PR, báo cáo.
- Đạt: CI xanh; không còn giới hạn 12 dự án; tải lại trang không mất dự án; `packages/core` không bị sửa.
- Kết quả: CI 44 test + 4 e2e đạt. Terminal Kiro hỏng nên Claude lấy file qua liên kết laptop và đẩy lên. Sửa theo Gemini: tự mở lại kết nối IndexedDB; kiểm ảnh bằng byte thật. **Việc để G2:** `list()`/`remove()` đang đọc toàn bộ dự án — tách kho tóm tắt riêng khi có nhiều dự án.

## G1-6 — File `.zunva` (Claude) — XONG (PR #40)
Nhánh: `feat/g1-6-zunva-file`. File để lưu ra máy, gửi người khác, mở lại — gồm cả thiết kế và ảnh.
- [x] 6.1 Định dạng: file ZIP **không nén** (ảnh PNG/JPEG đã nén sẵn), mở được bằng công cụ giải nén thường để kiểm tra:
  - `manifest.json`: `{ "format": "zunva", "formatVersion": 1, "schemaVersion": 2, "createdAt", "app" }`
  - `document.json`: `DesignDocument` (schema v2)
  - `assets/<assetId>`: nội dung ảnh/phông, kiểu file lấy từ `document.assets[id].mimeType`
- [x] 6.2 Trong `packages/core` (thuần TypeScript, không thư viện, không DOM): `packZunva(doc, assetBytes, now)` → `Uint8Array`; `unpackZunva(bytes)` → `{ ok: true, value: { document, assets } }` hoặc `{ ok: false, errors }`.
- [x] 6.3 An toàn khi mở file lạ — từ chối kèm lý do: không phải ZIP; sai `format`/phiên bản; CRC sai (file hỏng); kiểu nén chưa hỗ trợ; tên file lạ, có `..`, `/` đầu, hoặc trùng; thiếu ảnh mà thiết kế dùng; có ảnh thừa; quá 300 MB hoặc quá 2000 file; tài liệu không qua `validateDocument`.
- [x] 6.4 Test: đóng gói → mở lại giống hệt (cả ảnh); mỗi trường hợp hỏng ở 6.3 đều bị từ chối; tiếng Việt trong tên/chữ giữ nguyên.
- [ ] 6.5 Bộ nhập dự án v1.5: **ưu tiên thấp** (G1-0: không có dự án cần giữ) — chưa làm.
- Đạt: CI xanh; lõi vẫn qua luật không gọi React/DOM.

## G1-7 — APK C87 có giao diện thật + nghiệm thu G1
Mục tiêu: founder cài một APK ký bằng khóa C87 (`vn.c87.lsc`) lên S24+, mở ra là app mới (`zunva/apps/web`), tạo/lưu dự án, lưu và mở file `.zunva`.

### Chọn vỏ Android — CHỜ FOUNDER CHỌN
| | A. Dùng lại vỏ WebView đang có (`android/`) — **đề xuất** | B. Chuyển sang Capacitor ngay |
| --- | --- | --- |
| Làm gì | Sửa `MainActivity` cho phục vụ mọi file của bản build web; thêm cầu nối lưu file | Tạo dự án Android mới bằng Capacitor, chép lại cầu nối |
| Rủi ro | Thấp: vỏ đã chạy trên S24+, workflow ký đã chạy | Trung bình: thêm nhiều file sinh tự động, cần terminal chạy `npx cap` (terminal Kiro đang hỏng) |
| Dự toán Kiro | 40–90 credit | 120–250 credit |
| Về sau | Chuyển Capacitor khi làm bản iPhone/iPad (G5); phần web và `@zunva/platform` giữ nguyên | Dùng chung cho iOS ngay |

Phần dưới viết theo **A**. Nếu founder chọn B, Claude viết lại mục này trước khi giao việc.

### Chia việc
| Phần | Người làm | Thư mục được sửa |
| --- | --- | --- |
| Vỏ Android + workflow | Kiro | `android/`, `.github/workflows/android-release-apk.yml` |
| Nút Lưu/Mở `.zunva`, bản nền tảng Android phía web | Claude | `zunva/` |

Hợp đồng giữa hai bên (JavaScript gọi Java): `window.AndroidFileSaver.saveBytes(fileName, mimeType, base64)` → trả chuỗi JSON `{"ok":true,"location":"Tải xuống/C87"}` hoặc `{"ok":false,"error":"..."}`.

### Kiro (dự toán 40–90 credit), nhánh `feat/g1-7-vo-android`
- [ ] 7.1 `MainActivity`: phục vụ **mọi file trong `assets/`** của bản build (không chỉ 5 file v1.5): chặn `..`, `\`, đường dẫn rỗng; trả đúng kiểu file (html, js, css, svg, png, jpg, webp, woff2, json, ico); `/` và đường dẫn không có đuôi → `index.html`. Giữ: chặn trang ngoài, không cho truy cập file máy.
- [ ] 7.2 Cầu nối `AndroidFileSaver.saveBytes(fileName, mimeType, base64)` ghi vào `MediaStore.Downloads` thư mục `Download/C87` (Android 10+), chạy nền, trả JSON như hợp đồng. Giữ `AndroidImageSaver`, đổi thư mục ảnh thành `Pictures/C87`.
- [ ] 7.3 `android/app/build.gradle`: task chép `zunva/apps/web/dist/**` vào assets trước khi build; báo lỗi rõ nếu `dist` chưa có. `versionCode 16`, `versionName '1.0.0-g1'`.
- [ ] 7.4 Workflow `android-release-apk.yml`: thêm bước cài Node 22 + pnpm 10.28.0, `pnpm install --frozen-lockfile` và `pnpm build` trong `zunva/` **trước** bước build Android. Giữ nguyên mọi bước ký.
- [ ] 7.5 Terminal hỏng thì chỉ sửa file; Claude đẩy lên và chạy workflow trên nhánh để thử.

### Claude, nhánh `feat/g1-7-zunva-file-ui`
- [ ] 7.6 `createAndroidPlatform()` trong `@zunva/platform`: dùng `window.AndroidFileSaver` khi có, ngược lại dùng bản web.
- [ ] 7.7 Tab Dự án: mỗi dự án có nút **"Lưu file .zunva"** (gói thiết kế + ảnh từ kho); nút **"Mở file .zunva"** (chọn file → kiểm tra → lưu vào kho; trùng ID thì thêm thành bản sao, không ghi đè).
- [ ] 7.8 Test: Playwright lưu file → xóa dự án → mở lại file → dự án trở lại.

### Nghiệm thu G1 (founder trên S24+)
- [ ] Cài APK, mở ra thấy trang chủ app mới, 5 tab.
- [ ] Tạo 3 dự án, tắt hẳn app, mở lại vẫn còn.
- [ ] Lưu một dự án ra file `.zunva` → thấy file trong Tải xuống/C87.
- [ ] Xóa dự án đó, mở lại file `.zunva` → dự án trở lại.
- [ ] Gỡ app thử G1-1 nếu còn.

Câu hỏi founder: tên app hiện dưới biểu tượng trên điện thoại — giữ "AI Creator Studio" hay đổi thành **"C87"**? (Đổi tên hiển thị trong app — `PRODUCT_NAME` — cũng cần founder duyệt.)

## Ý tưởng chờ (chưa thuộc G1)
- Trang chủ G2: học cách bố trí từ video Canva founder quay 11/11 (một câu hỏi lớn + ô nhập, "Tiếp tục thiết kế", nút tròn theo mục đích, 5 tab, AI dạng trò chuyện có báo tiến độ, mẫu theo dịp Việt Nam, ô xám khi đang tải). **Không** dùng màu tím, logo, mẫu của Canva.
- Màu thương hiệu: hồng phấn hoặc xanh nhạt; founder muốn **nút chuyển màu nền** để người dùng tự chọn (sẽ gửi tham khảo).
