import { describe, expect, it } from 'vitest';
import type { DesignDocument, Layer, Op } from './index';
import {
  OpError,
  canRedo,
  canUndo,
  closeMerge,
  createDocument,
  createHistory,
  createIdGenerator,
  createImageLayer,
  createPage,
  createShapeLayer,
  createTextLayer,
  execute,
  redo,
  seededRandom,
  undo,
  undoLabel,
  validateDocument,
} from './index';

function baseDoc(): DesignDocument {
  const page = createPage('page_1', 1080, 1350, {
    layers: [
      createTextLayer('layer_title', { text: 'Lễ Thành Hôn', y: 200 }),
      createShapeLayer('layer_box', { x: 100, y: 600 }),
    ],
  });
  return createDocument('doc_1', page, 1_700_000_000_000, { name: 'Thiệp cưới' });
}

/** Sinh một op hợp lệ ngẫu nhiên dựa trên trạng thái hiện tại (hạt giống cố định). */
function randomOp(doc: DesignDocument, rnd: () => number, newId: (p: string) => string): Op {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
  const page = pick(doc.pages);
  const assets = Object.values(doc.assets);
  const usedAssets = new Set(
    doc.pages.flatMap((p) => [
      p.background.imageAssetId,
      ...p.layers.map((l) => (l.type === 'image' ? l.assetId : null)),
    ]),
  );
  const freeAssets = assets.filter((a) => !usedAssets.has(a.id));

  const choices: Array<() => Op> = [
    () => {
      const kind = assets.length > 0 ? pick(['text', 'shape', 'image'] as const) : pick(['text', 'shape'] as const);
      const id = newId('layer');
      const layer: Layer =
        kind === 'text'
          ? createTextLayer(id, { text: `Chữ ${Math.floor(rnd() * 1000)} — đặc biệt ữ ặ`, x: rnd() * 900 })
          : kind === 'image'
            ? createImageLayer(id, pick(assets).id, { y: rnd() * 1000 })
            : createShapeLayer(id, { shape: pick(['rect', 'ellipse', 'line'] as const) });
      return { op: 'addLayer', pageId: page.id, index: Math.floor(rnd() * (page.layers.length + 1)), layer };
    },
    () => ({ op: 'rename', name: `Tên ${Math.floor(rnd() * 100)}` }),
    () => ({
      op: 'updatePage',
      pageId: page.id,
      set: { background: { ...page.background, color: pick(['#ffffff', '#f4ede4', '#0d1422']) } },
    }),
    () => ({
      op: 'addAsset',
      asset: { id: newId('asset'), kind: 'image', mimeType: 'image/jpeg', name: null, hash: null, width: 1200, height: 800 },
    }),
    () => ({ op: 'addPage', index: Math.floor(rnd() * (doc.pages.length + 1)), page: createPage(newId('page'), 1080, 1080) }),
  ];

  if (page.layers.length > 0) {
    const layer = pick(page.layers);
    choices.push(
      () => ({ op: 'removeLayer', pageId: page.id, layerId: layer.id }),
      () => ({ op: 'moveLayer', pageId: page.id, layerId: layer.id, toIndex: Math.floor(rnd() * page.layers.length) }),
      () => ({
        op: 'updateLayer',
        pageId: page.id,
        layerId: layer.id,
        set: { x: Math.round(rnd() * 1000), rotation: Math.round(rnd() * 360), opacity: Math.round(rnd() * 100) / 100 },
      }),
    );
    if (layer.type === 'text') {
      choices.push(() => ({ op: 'updateLayer', pageId: page.id, layerId: layer.id, set: { text: 'Đã sửa', fontSize: 40 } }));
    }
  }
  if (doc.pages.length > 1) choices.push(() => ({ op: 'removePage', pageId: page.id }));
  if (freeAssets.length > 0) choices.push(() => ({ op: 'removeAsset', assetId: pick(freeAssets).id }));

  return pick(choices)();
}

describe('lịch sử hoàn tác theo lệnh', () => {
  it('100 thao tác ngẫu nhiên: hoàn tác hết về đúng ban đầu, làm lại hết về đúng cuối', () => {
    for (const seed of [1, 7, 42, 2026]) {
      const rnd = seededRandom(seed);
      const newId = createIdGenerator(seededRandom(seed + 1000));
      const initial = baseDoc();
      let h = createHistory(initial);
      const kinds = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const op = randomOp(h.doc, rnd, newId);
        kinds.add(op.op);
        h = execute(h, `bước ${i}`, [op]);
        const check = validateDocument(h.doc);
        expect(check.ok ? [] : check.errors).toEqual([]);
      }
      const final = h.doc;
      expect(h.undoStack).toHaveLength(100);
      // Bài thử phải đụng đủ các loại thao tác, không chỉ một loại.
      expect(kinds.size >= 8).toBe(true);
      expect(final).not.toEqual(initial);

      while (canUndo(h)) h = undo(h);
      expect(h.doc).toEqual(initial);

      while (canRedo(h)) h = redo(h);
      expect(h.doc).toEqual(final);
    }
  });

  it('kéo liên tục cùng mergeKey chỉ thành 1 bước hoàn tác', () => {
    const initial = baseDoc();
    let h = createHistory(initial);
    for (let x = 0; x < 10; x++) {
      h = execute(h, 'Kéo chữ', [{ op: 'updateLayer', pageId: 'page_1', layerId: 'layer_title', set: { x: x * 10 } }], {
        mergeKey: 'drag:layer_title',
      });
    }
    expect(h.undoStack).toHaveLength(1);
    expect(undoLabel(h)).toBe('Kéo chữ');
    h = undo(h);
    expect(h.doc).toEqual(initial);
  });

  it('closeMerge tách lần kéo sau thành bước mới', () => {
    let h = createHistory(baseDoc());
    const drag = (x: number) =>
      execute(h, 'Kéo', [{ op: 'updateLayer', pageId: 'page_1', layerId: 'layer_box', set: { x } }], { mergeKey: 'drag' });
    h = drag(1);
    h = drag(2);
    h = closeMerge(h);
    h = drag(3);
    expect(h.undoStack).toHaveLength(2);
  });

  it('thao tác mới xóa danh sách làm lại', () => {
    let h = createHistory(baseDoc());
    h = execute(h, 'Đổi tên', [{ op: 'rename', name: 'A' }]);
    h = undo(h);
    expect(canRedo(h)).toBe(true);
    h = execute(h, 'Đổi tên', [{ op: 'rename', name: 'B' }]);
    expect(canRedo(h)).toBe(false);
  });

  it('nhiều op trong một giao dịch: lỗi giữa chừng thì không đổi gì', () => {
    const h = createHistory(baseDoc());
    const before = h.doc;
    expect(() =>
      execute(h, 'Hỏng', [
        { op: 'rename', name: 'X' },
        { op: 'removeLayer', pageId: 'page_1', layerId: 'khong_co' },
      ]),
    ).toThrow(OpError);
    expect(h.doc).toBe(before);
    expect(h.doc.name).toBe('Thiệp cưới');
  });

  it('giữ tối đa `limit` bước', () => {
    let h = createHistory(baseDoc(), 5);
    for (let i = 0; i < 8; i++) h = execute(h, `Đổi ${i}`, [{ op: 'rename', name: `N${i}` }]);
    expect(h.undoStack).toHaveLength(5);
    while (canUndo(h)) h = undo(h);
    expect(h.doc.name).toBe('N2');
  });

  it('không chụp lại cả thiết kế: bước hoàn tác chỉ giữ op', () => {
    let h = createHistory(baseDoc());
    h = execute(h, 'Dời', [{ op: 'updateLayer', pageId: 'page_1', layerId: 'layer_box', set: { x: 5 } }]);
    const tx = h.undoStack[0]!;
    expect(JSON.stringify(tx).length).toBeLessThan(400);
  });
});

describe('thao tác bị từ chối khi sai', () => {
  const h = createHistory(baseDoc());
  const run = (op: Op) => () => execute(h, 'thử', [op]);

  it('sửa trường không thuộc loại lớp', () => {
    expect(run({ op: 'updateLayer', pageId: 'page_1', layerId: 'layer_box', set: { text: 'x' } })).toThrow(/không có trường "text"/);
  });
  it('thêm lớp trùng ID', () => {
    expect(run({ op: 'addLayer', pageId: 'page_1', index: 0, layer: createTextLayer('layer_box') })).toThrow(/đã tồn tại/);
  });
  it('thêm ảnh khi chưa có tài nguyên', () => {
    expect(run({ op: 'addLayer', pageId: 'page_1', index: 0, layer: createImageLayer('img_1', 'asset_x') })).toThrow(/tài nguyên/);
  });
  it('xóa trang cuối cùng', () => {
    expect(run({ op: 'removePage', pageId: 'page_1' })).toThrow(/ít nhất 1 trang/);
  });
  it('vị trí lớp ngoài phạm vi', () => {
    expect(run({ op: 'moveLayer', pageId: 'page_1', layerId: 'layer_box', toIndex: 9 })).toThrow(/không hợp lệ/);
  });
});
