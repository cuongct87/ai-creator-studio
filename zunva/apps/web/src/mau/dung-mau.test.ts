import { createIdGenerator, packZunva, seededRandom, unpackZunva, validateDocument, type DesignDocument } from '@zunva/core';
import type { ProjectStore, StoredAsset } from '@zunva/platform';
import { describe, expect, it } from 'vitest';
import { START_OPTIONS } from '../start-options';
import { buildTemplateDocument, estimateTextHeight, openTemplate, searchTemplates, TEMPLATE_KINDS, templateAssetId } from './dung-mau';
import { TEMPLATES } from './kho-mau';

function memoryStore(): { store: ProjectStore; docs: Map<string, DesignDocument>; assets: Map<string, StoredAsset> } {
  const docs = new Map<string, DesignDocument>();
  const assets = new Map<string, StoredAsset>();
  const store: ProjectStore = {
    list: async () => ({ ok: true, value: [] }),
    load: async (id) => {
      const d = docs.get(id);
      return d ? { ok: true, value: d } : { ok: false, error: 'không có' };
    },
    save: async (doc) => {
      docs.set(doc.id, doc);
      return { ok: true, value: doc };
    },
    remove: async () => ({ ok: true, value: undefined }),
    putAsset: async (id, mimeType, bytes) => {
      assets.set(id, { mimeType, bytes });
      return { ok: true, value: undefined };
    },
    getAsset: async (id) => {
      const a = assets.get(id);
      return a ? { ok: true, value: a } : { ok: false, error: 'không có' };
    },
    storageInfo: async () => ({ ok: true, value: { usedBytes: 0, quotaBytes: 0 } }),
    collectUnusedAssets: async () => ({ ok: true, value: 0 }),
  };
  return { store, docs, assets };
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('kho mẫu: 15 mẫu đầu', () => {
  it('đủ số mẫu từng loại như đặc tả (3-2-2-3-2-3), ID không trùng', () => {
    const count = (k: string) => TEMPLATES.filter((t) => t.kind === k).length;
    expect(TEMPLATES).toHaveLength(15);
    expect([count('wedding'), count('obituary'), count('signboard'), count('sale-post'), count('social'), count('wallpaper')]).toEqual([3, 2, 2, 3, 2, 3]);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(15);
    for (const t of TEMPLATES) expect(t.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('mỗi loại mẫu đều có trên trang chủ', () => {
    for (const t of TEMPLATES) expect(START_OPTIONS.some((o) => o.kind === t.kind)).toBe(true);
    expect(TEMPLATE_KINDS.map((k) => k.kind)).toEqual(['wedding', 'obituary', 'signboard', 'sale-post', 'social', 'wallpaper']);
  });

  it('dựng ra tài liệu hợp lệ, lưu thành .zunva và mở lại được', () => {
    for (const t of TEMPLATES) {
      const doc = buildTemplateDocument(t);
      const checked = validateDocument(doc);
      expect(checked.ok ? [] : checked.errors, t.id).toEqual([]);
      const packed = packZunva(doc, { [templateAssetId(t)]: JPEG }, 0);
      expect(packed.ok, t.id).toBe(true);
      if (packed.ok) expect(unpackZunva(packed.value).ok, t.id).toBe(true);
    }
  });

  it('mọi lớp nằm trong trang; chữ không lệch khỏi khung', () => {
    for (const t of TEMPLATES) {
      const page = buildTemplateDocument(t).pages[0]!;
      for (const l of page.layers) {
        expect(l.x >= 0 && l.y >= 0, `${t.id} ${l.id}`).toBe(true);
        expect(l.x + l.width <= page.width && l.y + l.height <= page.height, `${t.id} ${l.id}`).toBe(true);
      }
    }
  });

  it('chữ mẫu chừa chỗ trống trong ngoặc vuông cho thông tin riêng, ngoặc đóng mở đủ', () => {
    for (const t of TEMPLATES) {
      for (const item of t.items) {
        if (item.type !== 'text') continue;
        expect(item.text.trim(), `${t.id} ${item.key}`).not.toBe('');
        expect((item.text.match(/\[/g) ?? []).length, `${t.id} ${item.key}`).toBe((item.text.match(/\]/g) ?? []).length);
      }
    }
  });

  it('ảnh mẫu làm nền trang, trừ bảng hiệu (ảnh là lớp bên phải)', () => {
    for (const t of TEMPLATES) {
      const page = buildTemplateDocument(t).pages[0]!;
      if (t.kind === 'signboard') {
        expect(page.background.imageAssetId).toBeNull();
        expect(page.layers[0]).toMatchObject({ type: 'image', assetId: templateAssetId(t) });
      } else {
        expect(page.background.imageAssetId).toBe(templateAssetId(t));
      }
    }
  });

  it('ước lượng chiều cao chữ theo số dòng', () => {
    const one = estimateTextHeight({ text: 'abc', width: 1000, fontSize: 50, lineHeight: 1.2, letterSpacing: 0 });
    const two = estimateTextHeight({ text: 'abc\nabc', width: 1000, fontSize: 50, lineHeight: 1.2, letterSpacing: 0 });
    expect(one).toBe(60);
    expect(two).toBe(120);
    // 520 / (50 × 0,52) = 20 ký tự mỗi dòng → 100 ký tự = 5 dòng.
    expect(estimateTextHeight({ text: 'x'.repeat(100), width: 520, fontSize: 50, lineHeight: 1, letterSpacing: 0 })).toBe(250);
  });
});

describe('mở mẫu thành dự án mới', () => {
  const newId = createIdGenerator(seededRandom(7));
  const wedding = TEMPLATES.find((t) => t.id === 'thiep-cuoi-hoa-hong')!;

  it('tạo bản sao: ID mới, ghi ID mẫu gốc, ảnh lưu một lần cho nhiều dự án', async () => {
    const { store, docs, assets } = memoryStore();
    let loads = 0;
    const deps = { newId, now: 1000, screen: null, loadImage: async () => {
        loads += 1;
        return JPEG;
      },
    };
    const a = await openTemplate(store, wedding, deps);
    const b = await openTemplate(store, wedding, deps);
    expect(a?.ok && b?.ok).toBe(true);
    expect(loads).toBe(1);
    expect(assets.size).toBe(1);
    expect(docs.size).toBe(2);
    const doc = [...docs.values()][0]!;
    expect(doc.id).not.toBe('mau-thiep-cuoi-hoa-hong');
    expect(doc.meta).toEqual({ kind: 'wedding', locale: 'vi', templateId: 'mau-thiep-cuoi-hoa-hong' });
    expect(doc.name).toBe('Thiệp cưới hoa hồng');
    expect(doc.pages[0]!.layers.map((l) => l.id)).not.toContain('thiep-cuoi-hoa-hong-1');
    expect(validateDocument(doc).ok).toBe(true);
  });

  it('hình nền đổi khổ theo màn hình máy; mẫu khác giữ khổ', async () => {
    const { store, docs } = memoryStore();
    const deps = { newId, now: 1, screen: { width: 1440, height: 3120 }, loadImage: async () => JPEG };
    const wall = TEMPLATES.find((t) => t.kind === 'wallpaper')!;
    const r1 = await openTemplate(store, wall, deps);
    const r2 = await openTemplate(store, wedding, deps);
    const page = (r: typeof r1) => (r?.ok ? docs.get(r.id)!.pages[0]! : null);
    expect(page(r1)).toMatchObject({ width: 1440, height: 3120 });
    expect(page(r2)).toMatchObject({ width: 1748, height: 2480 });
  });

  it('không đọc được ảnh mẫu thì báo lỗi dễ hiểu, không lưu dự án', async () => {
    const { store, docs } = memoryStore();
    const r = await openTemplate(store, wedding, { newId, now: 1, screen: null, loadImage: async () => null });
    expect(r).toEqual({ ok: false, error: 'Không mở được ảnh của mẫu này. Hãy thử lại.' });
    expect(docs.size).toBe(0);
  });
});

describe('tìm mẫu', () => {
  const ids = (q: string, kind: string | null = null) => searchTemplates(q, kind).map((t) => t.id);

  it('gõ không dấu vẫn ra; lọc theo loại', () => {
    expect(ids('')).toHaveLength(15);
    expect(ids('thiep cuoi')).toEqual(['thiep-cuoi-hoa-hong', 'thiep-cuoi-la-xanh', 'thiep-cuoi-do-truyen-thong']);
    expect(ids('mien tay')).toEqual(['hinh-nen-song-nuoc-mien-tay']);
    expect(ids('com tam')).toEqual(['ban-hang-com-tam']);
    expect(ids('', 'obituary')).toEqual(['cao-pho-hoa-sen', 'cao-pho-hoa-cuc']);
    expect(ids('hoa pastel', 'wallpaper')).toEqual(['hinh-nen-hoa-pastel']);
    // Khớp đầu từ: "hoa" không ra mẫu chỉ có chữ "điện thoại" (hình nền khối tròn).
    expect(ids('hoa', 'wallpaper')).not.toContain('hinh-nen-hinh-hoc');
    expect(ids('không có gì')).toEqual([]);
  });
});
