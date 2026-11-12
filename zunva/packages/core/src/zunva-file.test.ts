import { describe, expect, it } from 'vitest';
import {
  crc32,
  createDocument,
  createImageLayer,
  createPage,
  createTextLayer,
  packZunva,
  readZip,
  unpackZunva,
  utf8Encode,
  writeZip,
  ZUNVA_MAX_ENTRIES,
} from './index';
import type { DesignDocument, ZipEntry } from './index';

const NOW = Date.UTC(2026, 10, 11, 18, 0, 0);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 255]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 8, 7]);

function sample(): DesignDocument {
  const page = createPage('page_1', 1080, 1350, {
    layers: [
      createTextLayer('t1', { text: 'Thiệp cưới Hùng – Lan, ngày mười hai 🎉' }),
      createImageLayer('i1', 'asset_a'),
      createImageLayer('i2', 'asset_b'),
    ],
  });
  const doc = createDocument('doc_1', page, NOW, { name: 'Thiệp cưới Cần Thơ' });
  return {
    ...doc,
    assets: {
      asset_a: { id: 'asset_a', kind: 'image', mimeType: 'image/png', name: 'ảnh cưới.png', hash: null, width: 10, height: 10 },
      asset_b: { id: 'asset_b', kind: 'image', mimeType: 'image/jpeg', name: null, hash: null, width: 20, height: 30 },
    },
  };
}

const sampleAssets = () => ({ asset_a: PNG, asset_b: JPG });

function packed(): Uint8Array {
  const r = packZunva(sample(), sampleAssets(), NOW);
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return r.value;
}

function errorsOf(bytes: Uint8Array): string {
  const r = unpackZunva(bytes);
  expect(r.ok).toBe(false);
  return r.ok ? '' : r.errors.join('\n');
}

/** Lấy các mục của gói mẫu để chế ra file hỏng theo ý muốn. */
function sampleEntries(): ZipEntry[] {
  const r = readZip(packed(), { maxEntries: 100, maxTotalBytes: 1e9 });
  if (!r.ok) throw new Error(r.error);
  return r.entries;
}

const rezip = (entries: ZipEntry[]) => writeZip(entries, NOW);
const replace = (entries: ZipEntry[], name: string, data: Uint8Array) =>
  entries.map((e) => (e.name === name ? { name, data } : e));

describe('file .zunva: đóng gói và mở lại', () => {
  it('mở lại giống hệt thiết kế và ảnh, giữ nguyên tiếng Việt', () => {
    const r = unpackZunva(packed());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.document).toEqual(sample());
    expect(r.value.assets['asset_a']).toEqual(PNG);
    expect(r.value.assets['asset_b']).toEqual(JPG);
    expect(r.value.document.name).toBe('Thiệp cưới Cần Thơ');
  });

  it('cùng đầu vào cho ra cùng byte', () => {
    expect(packed()).toEqual(packed());
  });

  it('thiết kế không có ảnh vẫn đóng gói và mở được', () => {
    const doc = createDocument('doc_2', createPage('p', 100, 100), NOW);
    const r = packZunva(doc, {}, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(unpackZunva(r.value)).toEqual({ ok: true, value: { document: doc, assets: {} } });
  });

  it('bên trong là ZIP chuẩn: manifest, document, assets/<id>', () => {
    const names = sampleEntries().map((e) => e.name);
    expect(names).toEqual(['manifest.json', 'document.json', 'assets/asset_a', 'assets/asset_b']);
  });

  it('CRC-32 đúng chuẩn', () => {
    expect(crc32(utf8Encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('file .zunva: từ chối khi đóng gói sai', () => {
  it('thiếu nội dung ảnh', () => {
    const r = packZunva(sample(), { asset_a: PNG }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('asset_b');
  });

  it('thừa ảnh không có trong thiết kế', () => {
    const r = packZunva(sample(), { ...sampleAssets(), la: PNG }, NOW);
    expect(r.ok).toBe(false);
  });

  it('ID ảnh có ký tự không an toàn làm tên file', () => {
    const doc = sample();
    const bad: DesignDocument = {
      ...doc,
      pages: [createPage('page_1', 1080, 1350, { layers: [createImageLayer('i1', '../x')] })],
      assets: { '../x': { ...doc.assets['asset_a']!, id: '../x' } },
    };
    const r = packZunva(bad, { '../x': PNG }, NOW);
    expect(r.ok).toBe(false);
  });

  it('thiết kế không hợp lệ', () => {
    const doc = { ...sample(), pages: [] } as DesignDocument;
    expect(packZunva(doc, sampleAssets(), NOW).ok).toBe(false);
  });
});

describe('file .zunva: mở file lạ hoặc hỏng một cách an toàn', () => {
  it('không phải ZIP', () => {
    expect(errorsOf(utf8Encode('xin chào, đây là file chữ thường'))).toContain('ZIP');
    expect(errorsOf(new Uint8Array(0))).toContain('ZIP');
  });

  it('file bị hỏng một byte giữa dữ liệu ảnh (sai CRC)', () => {
    const bytes = packed();
    const at = bytes.length - 150;
    bytes[at] = bytes[at]! ^ 0xff;
    expect(unpackZunva(bytes).ok).toBe(false);
  });

  it('file bị cắt cụt', () => {
    const bytes = packed();
    expect(unpackZunva(bytes.slice(0, bytes.length - 10)).ok).toBe(false);
    expect(unpackZunva(bytes.slice(0, 40)).ok).toBe(false);
  });

  it('kiểu nén chưa hỗ trợ', () => {
    const bytes = packed();
    // Đổi "method" (offset 10) của mục lục đầu tiên sang 8 (deflate).
    const view = new DataView(bytes.buffer);
    const end = bytes.length - 22;
    const central = view.getUint32(end + 16, true);
    view.setUint16(central + 10, 8, true);
    expect(errorsOf(bytes)).toContain('nén');
  });

  it('ZIP thường nhưng không phải .zunva', () => {
    expect(errorsOf(rezip([{ name: 'readme.txt', data: utf8Encode('hi') }]))).toMatch(/lạ|manifest/);
  });

  it('sai định dạng trong manifest', () => {
    const e = replace(sampleEntries(), 'manifest.json', utf8Encode('{"format":"other","formatVersion":1,"schemaVersion":2}'));
    expect(errorsOf(rezip(e))).toContain('Không phải file thiết kế');
  });

  it('file từ phiên bản app mới hơn', () => {
    const e = replace(sampleEntries(), 'manifest.json', utf8Encode('{"format":"zunva","formatVersion":2,"schemaVersion":2}'));
    expect(errorsOf(rezip(e))).toContain('cập nhật app');
  });

  it('file .zunva cũ (dữ liệu v2, trước G2b) vẫn mở được và tự nâng lên v3', () => {
    const doc = JSON.parse(JSON.stringify(sample())) as { schemaVersion: number; pages: Array<{ layers: Array<Record<string, unknown>> }> };
    doc.schemaVersion = 2;
    for (const l of doc.pages[0]!.layers) {
      delete l['blendMode'];
      delete l['feather'];
      delete l['maskAssetId'];
    }
    let e = replace(sampleEntries(), 'manifest.json', utf8Encode('{"format":"zunva","formatVersion":1,"schemaVersion":2}'));
    e = replace(e, 'document.json', utf8Encode(JSON.stringify(doc)));
    const r = unpackZunva(rezip(e));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.document.schemaVersion).toBe(3);
    expect(r.value.document.pages[0]!.layers[1]).toMatchObject({ type: 'image', feather: 0, maskAssetId: null, blendMode: 'normal' });
  });

  it('dữ liệu phiên bản lạ bị từ chối', () => {
    const e = replace(sampleEntries(), 'manifest.json', utf8Encode('{"format":"zunva","formatVersion":1,"schemaVersion":7}'));
    expect(errorsOf(rezip(e))).toContain('chưa hỗ trợ');
  });

  it('manifest hỏng chỉ báo một lỗi', () => {
    const r = unpackZunva(rezip(replace(sampleEntries(), 'manifest.json', utf8Encode('{oops'))));
    expect(r).toEqual({ ok: false, errors: ['manifest.json: không đọc được (JSON hỏng)'] });
  });

  it('JSON hỏng hoặc không phải UTF-8', () => {
    expect(errorsOf(rezip(replace(sampleEntries(), 'document.json', utf8Encode('{"id":'))))).toContain('JSON');
    expect(errorsOf(rezip(replace(sampleEntries(), 'document.json', new Uint8Array([0xff, 0xfe]))))).toContain('UTF-8');
  });

  it('tên file nguy hiểm hoặc lạ', () => {
    for (const name of ['../evil', '/etc/passwd', 'assets/../../x', 'assets\\x', 'assets/', 'ASSETS/asset_a']) {
      expect(errorsOf(rezip([...sampleEntries(), { name, data: PNG }]))).toContain('File lạ');
    }
  });

  it('tên file bị trùng', () => {
    const e = sampleEntries();
    expect(errorsOf(rezip([...e, e[2]!]))).toContain('trùng');
  });

  it('thiếu ảnh mà thiết kế đang dùng', () => {
    const e = sampleEntries().filter((x) => x.name !== 'assets/asset_b');
    expect(errorsOf(rezip(e))).toContain('Thiếu tài nguyên "asset_b"');
  });

  it('có ảnh thừa', () => {
    expect(errorsOf(rezip([...sampleEntries(), { name: 'assets/la', data: PNG }]))).toContain('thừa');
  });

  it('tài liệu bên trong không hợp lệ', () => {
    const doc = { ...sample(), pages: [] };
    expect(errorsOf(rezip(replace(sampleEntries(), 'document.json', utf8Encode(JSON.stringify(doc)))))).toContain(
      'Thiết kế không hợp lệ',
    );
  });

  it('quá nhiều mục', () => {
    const many: ZipEntry[] = [];
    for (let i = 0; i <= ZUNVA_MAX_ENTRIES; i++) many.push({ name: `assets/a${i}`, data: new Uint8Array(0) });
    expect(errorsOf(rezip(many))).toContain('quá nhiều mục');
  });

  it('dữ liệu rác ngẫu nhiên không bao giờ làm sập', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) & 0xff);
    const base = packed();
    for (let round = 0; round < 300; round++) {
      const bytes = base.slice();
      for (let k = 0; k < 4; k++) bytes[(rnd() * 257 + round * 31) % bytes.length] = rnd();
      expect(() => unpackZunva(bytes)).not.toThrow();
    }
  });
});
