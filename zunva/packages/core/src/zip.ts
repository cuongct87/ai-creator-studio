/**
 * ZIP tối giản, chỉ kiểu "lưu nguyên" (stored, không nén), dùng cho file `.zunva`.
 * Ảnh PNG/JPEG đã nén sẵn nên nén thêm gần như không lợi; bỏ nén giúp lõi không cần thư viện
 * và tránh "bom zip" (file nhỏ giải nén ra cực lớn). Không hỗ trợ ZIP64, mã hóa, nhiều đĩa.
 * Thuần TypeScript, không DOM.
 */

declare const TextEncoder: { new (): { encode(input?: string): Uint8Array } };
declare const TextDecoder: {
  new (label?: string, options?: { fatal?: boolean }): { decode(input?: Uint8Array): string };
};

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export type ReadZipResult = { ok: true; entries: ZipEntry[] } | { ok: false; error: string };

export interface ReadZipLimits {
  maxEntries: number;
  maxTotalBytes: number;
}

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const FLAG_UTF8 = 0x0800;
const FLAG_ENCRYPTED = 0x0001;
const METHOD_STORED = 0;
const VERSION = 20;
const MAX_U32 = 0xffffffff;
const MAX_U16 = 0xffff;

let crcTable: Uint32Array | null = null;

function table(): Uint32Array {
  if (crcTable) return crcTable;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  crcTable = t;
  return t;
}

/** CRC-32 (chuẩn ZIP) để phát hiện file bị hỏng. */
export function crc32(data: Uint8Array): number {
  const t = table();
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = (t[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Giải mã UTF-8; byte sai chuẩn thì trả null thay vì chèn ký tự lạ. */
export function utf8Decode(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Giờ kiểu MS-DOS mà ZIP dùng (theo UTC, bước 2 giây). */
function dosDateTime(ms: number): { time: number; date: number } {
  const d = new Date(ms);
  const year = Math.min(Math.max(d.getUTCFullYear(), 1980), 2107);
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2);
  const date = ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { time, date };
}

/**
 * Ghi các mục thành một file ZIP (không nén). Cùng đầu vào và cùng `modifiedAt` → cùng byte ra.
 * Ném lỗi nếu vượt giới hạn ZIP thường (4 GB, 65535 mục) — `.zunva` đặt giới hạn thấp hơn nhiều.
 */
export function writeZip(entries: readonly ZipEntry[], modifiedAt: number): Uint8Array {
  if (entries.length > MAX_U16) throw new Error('Quá nhiều mục trong ZIP');
  const { time, date } = dosDateTime(modifiedAt);
  const prepared = entries.map((e) => ({ name: utf8Encode(e.name), data: e.data, crc: crc32(e.data) }));

  let localSize = 0;
  let centralSize = 0;
  for (const e of prepared) {
    localSize += 30 + e.name.length + e.data.length;
    centralSize += 46 + e.name.length;
  }
  const total = localSize + centralSize + 22;
  if (total > MAX_U32) throw new Error('File ZIP quá lớn');

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let pos = 0;
  const u16 = (v: number) => {
    view.setUint16(pos, v, true);
    pos += 2;
  };
  const u32 = (v: number) => {
    view.setUint32(pos, v >>> 0, true);
    pos += 4;
  };
  const bytes = (b: Uint8Array) => {
    out.set(b, pos);
    pos += b.length;
  };

  const offsets: number[] = [];
  for (const e of prepared) {
    offsets.push(pos);
    u32(SIG_LOCAL);
    u16(VERSION);
    u16(FLAG_UTF8);
    u16(METHOD_STORED);
    u16(time);
    u16(date);
    u32(e.crc);
    u32(e.data.length);
    u32(e.data.length);
    u16(e.name.length);
    u16(0);
    bytes(e.name);
    bytes(e.data);
  }

  const centralStart = pos;
  prepared.forEach((e, i) => {
    u32(SIG_CENTRAL);
    u16(VERSION);
    u16(VERSION);
    u16(FLAG_UTF8);
    u16(METHOD_STORED);
    u16(time);
    u16(date);
    u32(e.crc);
    u32(e.data.length);
    u32(e.data.length);
    u16(e.name.length);
    u16(0);
    u16(0);
    u16(0);
    u16(0);
    u32(0);
    u32(offsets[i]!);
    bytes(e.name);
  });

  const centralLength = pos - centralStart;
  u32(SIG_END);
  u16(0);
  u16(0);
  u16(prepared.length);
  u16(prepared.length);
  u32(centralLength);
  u32(centralStart);
  u16(0);
  return out;
}

/**
 * Đọc file ZIP kiểu "lưu nguyên". Kiểm tra mọi vị trí nằm trong file, CRC từng mục,
 * và giới hạn số mục / tổng dung lượng. Không tin vào kích thước ghi trong file.
 */
export function readZip(input: Uint8Array, limits: ReadZipLimits): ReadZipResult {
  const fail = (error: string): ReadZipResult => ({ ok: false, error });
  if (input.length < 22) return fail('File quá nhỏ, không phải file ZIP');
  if (input.length > limits.maxTotalBytes) return fail('File quá lớn');
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const u16 = (at: number) => view.getUint16(at, true);
  const u32 = (at: number) => view.getUint32(at, true);

  // Bản ghi kết thúc nằm ở cuối, có thể theo sau bởi chú thích tối đa 65535 byte.
  let end = -1;
  const lowest = Math.max(0, input.length - 22 - MAX_U16);
  for (let i = input.length - 22; i >= lowest; i--) {
    if (u32(i) === SIG_END && i + 22 + u16(i + 20) === input.length) {
      end = i;
      break;
    }
  }
  if (end < 0) return fail('Không phải file ZIP (thiếu phần kết thúc)');
  if (u16(end + 4) !== 0 || u16(end + 6) !== 0) return fail('Không hỗ trợ ZIP chia nhiều phần');

  const count = u16(end + 10);
  if (count !== u16(end + 8)) return fail('Phần kết thúc ZIP không khớp');
  if (count > limits.maxEntries) return fail(`File có quá nhiều mục (${count})`);
  const centralSize = u32(end + 12);
  const centralStart = u32(end + 16);
  if (centralStart + centralSize > end) return fail('Mục lục ZIP nằm ngoài file');

  const entries: ZipEntry[] = [];
  let pos = centralStart;
  let totalData = 0;
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || u32(pos) !== SIG_CENTRAL) return fail(`Mục lục ZIP hỏng ở mục ${i + 1}`);
    const flags = u16(pos + 8);
    const method = u16(pos + 10);
    const crc = u32(pos + 16);
    const compressed = u32(pos + 20);
    const size = u32(pos + 24);
    const nameLen = u16(pos + 28);
    const extraLen = u16(pos + 30);
    const commentLen = u16(pos + 32);
    const localAt = u32(pos + 42);
    const nameEnd = pos + 46 + nameLen;
    if (nameEnd > end) return fail(`Tên mục ${i + 1} nằm ngoài file`);
    const name = utf8Decode(input.subarray(pos + 46, nameEnd));
    if (name === null) return fail(`Tên mục ${i + 1} không phải chữ hợp lệ`);
    pos = nameEnd + extraLen + commentLen;

    if (flags & FLAG_ENCRYPTED) return fail(`"${name}" bị mã hóa, không mở được`);
    if (method !== METHOD_STORED) return fail(`"${name}" dùng kiểu nén chưa hỗ trợ`);
    if (compressed !== size) return fail(`"${name}" có kích thước không khớp`);

    if (localAt + 30 > centralStart || u32(localAt) !== SIG_LOCAL) return fail(`"${name}" hỏng phần đầu`);
    const dataAt = localAt + 30 + u16(localAt + 26) + u16(localAt + 28);
    if (dataAt + size > centralStart) return fail(`"${name}" nằm ngoài file`);
    totalData += size;
    if (totalData > limits.maxTotalBytes) return fail('Tổng dung lượng giải nén quá lớn');

    const data = input.slice(dataAt, dataAt + size);
    if (crc32(data) !== crc) return fail(`"${name}" bị hỏng (sai mã kiểm tra CRC)`);
    entries.push({ name, data });
  }
  return { ok: true, entries };
}
