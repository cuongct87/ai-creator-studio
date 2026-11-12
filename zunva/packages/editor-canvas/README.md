# @zunva/editor-canvas

Vẽ một trang `DesignDocument` bằng Konva (react-konva) và báo mọi thay đổi bằng `Op` của `@zunva/core`.
Hợp đồng: `.kiro/specs/g2-trang-chu-chinh-sua/design.md`. Canvas **không giữ** tài liệu: khung ngoài chạy
`execute()` của lõi, nên hoàn tác/làm lại nằm một chỗ.

## Dùng

```tsx
const ref = useRef<DesignCanvasHandle>(null);
<div style={{ height: '70vh' }}>
  <DesignCanvas
    ref={ref}
    document={history.doc}
    pageId={pageId}
    selection={selection}
    onSelect={setSelection}
    onOps={(label, ops, mergeKey) => setHistory((h) => execute(h, label, ops, mergeKey ? { mergeKey } : {}))}
    onGestureEnd={() => setHistory(closeMerge)}
    assetUrl={(id) => urls.get(id)}
  />
</div>
```

Khung bao ngoài phải có chiều cao: canvas chiếm 100% × 100% khung đó.

## Quy ước tọa độ (mọi bộ vẽ, kể cả xuất PNG/PDF sau này, phải theo)
- Lớp vẽ bằng: dời tới `(x, y)` → xoay `rotation` độ → vẽ khung `[0, width] × [0, height]`.
  Tức là `(x, y)` là góc trên-trái **của chính lớp**, và lớp xoay quanh góc đó.
- Hình tròn (`ellipse`) nằm vừa trong khung đó. Đường (`line`) là đường ngang giữa khung.
- Ảnh: `crop` là tỉ lệ 0 → 1 của ảnh gốc; `flipX/flipY` lật trong khung.
- Ảnh nền trang: phủ kín trang, không kéo méo (kiểu "cover"), canh giữa.

## Lệnh phát ra
| Thao tác | Lệnh | mergeKey | onGestureEnd |
| --- | --- | --- | --- |
| Kéo 1 lớp | `updateLayer { x, y }` liên tục (mỗi khung hình) | `drag:<layerId>` | khi thả tay |
| Kéo nhiều lớp đang chọn | 1 lần khi thả tay, mỗi lớp một `updateLayer` | `transform:<ids>` | khi thả tay |
| Hai ngón khi đang chọn 1 lớp (phóng + xoay lớp) | `updateLayer { x, y, width, height, rotation }` (chữ thêm `fontSize`) liên tục | `drag:<layerId>` (gộp với lần kéo 1 ngón ngay trước) | khi nhấc ngón |
| Hai ngón khi không chọn lớp nào | không có lệnh (chỉ phóng/di chuyển trang) | — | khi nhấc ngón |
| Tay nắm góc (↻): xoay quanh tâm, hút 0/90/180/270° khi lệch ≤ 5° | `updateLayer { x, y, rotation }` liên tục | `transform:<layerId>` | khi thả tay |
| Tay nắm giữa cạnh: kéo dãn một chiều (chữ: chỉ bề ngang khung) | 1 lần khi thả tay: `{ x, y, width, height }`; chữ: `{ x, y, width, height }` | `transform:<ids>` | khi thả tay |
| Sửa chữ | 1 `updateLayer { text, height }` khi xong | không | không |
| Nét tẩy / khôi phục (chế độ tẩy) | canvas **không** phát lệnh: gọi `onMaskStroke(layerId, png)` 1 lần khi nhấc ngón | — | không |

Nhãn hoàn tác canvas dùng: "Di chuyển", "Đổi cỡ / xoay", "Xoay", "Sửa chữ", "Bỏ chữ trống".
Nhãn đề nghị cho app (G2b): "Tẩy" / "Khôi phục" (sau `onMaskStroke`: `addAsset` + `updateLayer { maskAssetId }`
trong 1 bước), "Bỏ hết vùng tẩy", "Hòa trộn", "Mờ viền".

Số trong lệnh luôn gọn: `fontSize` số nguyên, `x/y/width/height` 0,1 px, `rotation` 0,1° trong [0, 360).

Kéo dãn bằng tay nắm cạnh chỉ báo khi thả tay vì Konva đổi `scale` trong lúc kéo; báo giữa chừng sẽ làm
kích thước bị nhân hai lần. Lớp `locked` chọn được nhưng không kéo được; lớp `hidden` không vẽ.

## Sửa chữ
- Chạm vào lớp chữ chưa chọn → chọn. Chạm thêm 1 lần (nhanh < 300 ms, lệch < 10 px) → mở ô gõ. Chạm 2 lần nhanh cũng được.
- Ứng dụng gọi `ref.startTextEdit(layerId)` ngay sau khi thêm chữ mới để mở ô gõ luôn (lớp chưa vẽ kịp thì canvas tự chờ vài khung hình).

## Nút xoay trên lớp mỏng
Khi một cạnh lớp trên màn hình < 88 px (ví dụ chữ 1 dòng), 4 nút ↻ được đẩy ra ngoài theo đường chéo góc
để cách nhau và cách nút kéo dãn giữa cạnh ≥ 44 px. Khoảng đẩy tính theo px màn hình, cập nhật khi phóng/thu trang.

## Ghép ảnh (G2b)
Prop mới (prop cũ giữ nguyên):

| Prop | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `brush` | `{ layerId, mode: 'erase' \| 'restore', size, softness } \| null` | Bật chế độ tẩy cho 1 lớp ảnh. `size` = đường kính cọ, px màn hình. `softness` 0 → 1 = mép cọ cứng → mềm. |
| `onMaskStroke` | `(layerId, png: Uint8Array) => void` | Một nét xong: PNG mặt nạ mới (xám: trắng = giữ, đen = tẩy), cạnh dài ≤ 1024, cùng tỉ lệ khung lớp. |

- `blendMode` của mọi lớp → `globalCompositeOperation` (`'normal'` → `'source-over'`). Ảnh xuất dùng cùng cây vẽ nên giống màn hình.
- Lớp ảnh có `feather > 0` hoặc `maskAssetId` được vẽ qua canvas phụ (cạnh dài ≤ 2048): ảnh (lật) → mặt nạ
  `destination-in` (lật cùng ảnh, nên lật ảnh thì vùng tẩy đi theo) → khung bo góc làm mờ `blur()` `destination-in`.
  Chỉ dựng lại khi khóa đổi (ảnh, mặt nạ, cỡ, bo góc, mờ viền, lật, cắt). Trình duyệt thiếu `ctx.filter` thì bỏ mờ viền, ảnh vẫn hiện.
- Mặt nạ đang tải lần đầu → ô xám (không bao giờ hiện ảnh chưa tẩy). Sau một nét, canvas giữ hình vừa tẩy cho tới khi `maskAssetId` mới tới.
- Chế độ tẩy: 1 ngón tô (nét liền, xem trước mỗi khung hình), 2 ngón phóng/di chuyển trang (nét đang tô bị bỏ),
  không chọn/kéo/xoay lớp, ẩn tay nắm.

## Phông chữ
6 phông OFL có bộ chữ tiếng Việt (đã kiểm trên api.fontsource.org): Be Vietnam Pro, Playfair Display,
Dancing Script, Lora, Montserrat, Pacifico. Chỉ nạp bộ `latin` + `vietnamese`, độ đậm 400 và 700
(Pacifico chỉ có 400; Dancing Script và Pacifico không có kiểu nghiêng thật). `fontsReady()` chờ tải xong.

## Lưu ý cho ứng dụng
- Gói dùng **React 19.3.0** (react-konva 19.3.2 cần React ≥ 19.3). Ứng dụng dùng gói này cũng phải dùng
  đúng React 19.3.0, nếu không sẽ có hai bản React và canvas không chạy.
- Test: `geometry.test.ts`, `mask.test.ts` (Vitest, chạy trong Node, không cần trình duyệt).
  `composite.ts` (vẽ canvas phụ) cần trình duyệt nên chưa có test tự động.
