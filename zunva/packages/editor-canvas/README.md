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
| Phóng to, thu nhỏ, xoay (tay nắm) | 1 lần khi thả tay: `{ x, y, rotation, width, height }`; chữ: `{ width, fontSize, height }` | `transform:<ids>` | khi thả tay |
| Sửa chữ | 1 `updateLayer { text, height }` khi xong | không | không |

Đổi cỡ chỉ báo khi thả tay (không báo liên tục) vì Konva đổi `scale` trong lúc kéo; báo giữa chừng sẽ làm
kích thước bị nhân hai lần. Lớp `locked` chọn được nhưng không kéo được; lớp `hidden` không vẽ.

## Phông chữ
6 phông OFL có bộ chữ tiếng Việt (đã kiểm trên api.fontsource.org): Be Vietnam Pro, Playfair Display,
Dancing Script, Lora, Montserrat, Pacifico. Chỉ nạp bộ `latin` + `vietnamese`, độ đậm 400 và 700
(Pacifico chỉ có 400; Dancing Script và Pacifico không có kiểu nghiêng thật). `fontsReady()` chờ tải xong.

## Lưu ý cho ứng dụng
- Gói dùng **React 19.3.0** (react-konva 19.3.2 cần React ≥ 19.3). Ứng dụng dùng gói này cũng phải dùng
  đúng React 19.3.0, nếu không sẽ có hai bản React và canvas không chạy.
- Test: `geometry.test.ts` (Vitest, chạy trong Node, không cần trình duyệt).
