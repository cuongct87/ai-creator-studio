// Artio — tự kiểm tra bản Windows trên laptop (G4).
// Chạy bằng "chay-kiem-tra-windows.bat" (bấm đúp). Cần: đã cài BẢN KIỂM TRA (artio-windows-ban-kiem-tra),
// laptop có Node và zunva/node_modules (đã "pnpm install" như khi kiểm tra điện thoại).
// App bản kiểm tra mở cổng 9333 chỉ trên máy này; kịch bản nối vào bằng Playwright (cách chính thức cho WebView2).
// Kết quả: kiem-tra-windows/ket-qua/<thời điểm>/ (bao-cao.md, ket-qua.json, ảnh từng bước).
// Dự án thử và file thử tự xóa khi xong. Một cửa sổ Explorer sẽ mở ở bước "Mở thư mục" — đóng sau cũng được.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const PORT = 9333;
const EXE_NAMES = ['Artio.exe', 'artio-desktop.exe'];

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const out = path.join(here, 'ket-qua', stamp);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(here, 'ket-qua', 'moi-nhat.txt'), out);
const started = Date.now();

function loadPlaywright() {
  const pnpm = path.join(repo, 'zunva', 'node_modules', '.pnpm');
  const dirs = fs.existsSync(pnpm) ? fs.readdirSync(pnpm).filter((d) => d.startsWith('playwright-core@')).sort().reverse() : [];
  for (const d of dirs) {
    const p = path.join(pnpm, d, 'node_modules', 'playwright-core');
    if (fs.existsSync(p)) return createRequire(import.meta.url)(p);
  }
  throw new Error('Không thấy Playwright trong zunva/node_modules. Chạy "pnpm install" trong thư mục zunva một lần.');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const steps = [];
const createdProjects = [];
let browser;
let page;
let shotNo = 0;
let exeName = 'Artio.exe';

async function shot(name) {
  shotNo += 1;
  const file = `${String(shotNo).padStart(2, '0')}-${name}.png`;
  try {
    await page.screenshot({ path: path.join(out, file) });
    return file;
  } catch {
    return null;
  }
}

async function step(name, fn) {
  const t0 = Date.now();
  let ok = true;
  let detail = '';
  try {
    detail = (await fn()) ?? '';
  } catch (e) {
    ok = false;
    detail = String(e?.message ?? e).split('\n')[0];
  }
  const file = page ? await shot(name.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)) : null;
  steps.push({ name, ok, detail, ms: Date.now() - t0, shot: file });
  console.log(`${ok ? 'ĐẠT ' : 'LỖI '} ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

async function waitFor(check, what, timeout = 4000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = await check();
    if (v) return v;
    await sleep(150);
  }
  throw new Error(`hết ${timeout / 1000}s mà chưa thấy: ${what}`);
}

/** Thư mục thật của Windows (Ảnh/Tải xuống có thể nằm trong OneDrive). */
function knownFolder(kind) {
  const ps =
    kind === 'pictures'
      ? "[Environment]::GetFolderPath('MyPictures')"
      : "(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path";
  return execFileSync('powershell', ['-NoProfile', '-Command', `[Console]::OutputEncoding=[Text.Encoding]::UTF8; ${ps}`], { encoding: 'utf8' }).trim();
}
const dirs = { pictures: '', downloads: '' };
/** File mới (tạo sau khi bắt đầu kiểm tra) trong thư mục Artio, mới nhất trước. */
function newFiles(kind, ext) {
  const dir = path.join(dirs[kind], 'Artio');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(ext))
    .map((f) => ({ f: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .filter((x) => x.t >= started - 2000)
    .sort((a, b) => b.t - a.t)
    .map((x) => x.f);
}
const made = new Set();
function head(file, n) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(n);
  fs.readSync(fd, buf, 0, n, 0);
  fs.closeSync(fd);
  return buf;
}

function findExe() {
  const local = process.env.LOCALAPPDATA ?? '';
  const roots = [path.join(local, 'Artio'), path.join(local, 'Programs', 'Artio'), path.join(process.env.ProgramFiles ?? '', 'Artio')];
  for (const r of roots) for (const n of EXE_NAMES) if (fs.existsSync(path.join(r, n))) return path.join(r, n);
  throw new Error(`Chưa cài Artio (không thấy trong ${roots.join(' ; ')}). Cài file artio-windows-ban-kiem-tra trước.`);
}

async function portOpen() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return r.ok;
  } catch {
    return false;
  }
}

async function launchAndConnect(exe) {
  exeName = path.basename(exe);
  try {
    execFileSync('taskkill', ['/IM', path.basename(exe), '/F'], { stdio: 'ignore' });
    await sleep(1500);
  } catch {}
  spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();
  try {
    await waitFor(portOpen, `cổng ${PORT}`, 20000);
  } catch {
    throw new Error('App mở nhưng không điều khiển được: máy đang cài BẢN THƯỜNG. Cài file artio-windows-ban-kiem-tra rồi chạy lại.');
  }
  const { chromium } = loadPlaywright();
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  page = await waitFor(() => browser.contexts().flatMap((c) => c.pages()).find((p) => /tauri\.localhost/.test(p.url())), 'trang Artio', 15000);
  await page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' }).waitFor({ timeout: 15000 });
}

const projectId = () => new URL(page.url()).searchParams.get('project');
const nav = (name) => page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name, exact: true });
const home = async () => {
  if (projectId()) await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await nav('Trang chủ').click();
  await page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' }).waitFor({ timeout: 5000 });
};
const exportSheet = () => page.getByRole('dialog', { name: /Xuất thiết kế/ });

/** Ảnh mẫu tự tạo: nền xám nhạt, hình tròn xanh ở giữa. */
function samplePng(w = 400, h = 400) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = (x - w / 2) ** 2 + (y - h / 2) ** 2 < (w / 4) ** 2;
      raw.set(inside ? [40, 120, 210] : [225, 228, 232], y * (w * 3 + 1) + 1 + x * 3);
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function exportAs(format) {
  await page.getByRole('button', { name: 'Xuất', exact: true }).click();
  const sheet = exportSheet();
  await sheet.waitFor({ timeout: 3000 });
  await sheet.getByRole('group', { name: 'Định dạng' }).getByRole('button', { name: new RegExp(format) }).click();
  const t0 = Date.now();
  await sheet.getByRole('button', { name: 'Xuất', exact: true }).click();
  const msg = await waitFor(async () => {
    const t = await sheet.innerText();
    if (/Không|lỗi/i.test(t) && !/Đang xuất/.test(t)) throw new Error(t.split('\n').find((l) => /Không|lỗi/i.test(l)) ?? 'lỗi xuất');
    return /Đã lưu/.test(t) ? t.split('\n').find((l) => /Đã lưu/.test(l)) : null;
  }, 'báo "Đã lưu"', 20000);
  return { msg, ms: Date.now() - t0, sheet };
}

async function main() {
  const exe = await (async () => {
    let found = null;
    await step('Tìm Artio đã cài', async () => {
      found = findExe();
      dirs.pictures = knownFolder('pictures');
      dirs.downloads = knownFolder('downloads');
      return `${found} · Ảnh: ${dirs.pictures} · Tải xuống: ${dirs.downloads}`;
    });
    return found;
  })();
  if (!exe) return;

  const opened = await step('Mở Artio (bản kiểm tra) và nối được vào app', async () => {
    const t0 = Date.now();
    await launchAndConnect(exe);
    const info = await page.evaluate(() => `${innerWidth}×${innerHeight} css, tỉ lệ ${devicePixelRatio}, ${navigator.userAgent.match(/Edg\/[\d.]+/)?.[0] ?? ''}`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) throw new Error(`trang chủ bị cuộn ngang ${over}px`);
    return `mở sau ${((Date.now() - t0) / 1000).toFixed(1)} s · cửa sổ ${info}`;
  });
  if (!opened) return;

  await step('Tạo "Mạng xã hội" (trang trắng 1080×1080) và thêm chữ', async () => {
    await page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }).click();
    await page.getByRole('dialog', { name: 'Chọn mẫu Mạng xã hội' }).getByRole('button', { name: 'Trang trắng' }).click();
    await page.getByRole('region', { name: /Trang 1080×1080, 0 lớp/ }).waitFor({ timeout: 6000 });
    createdProjects.push(projectId());
    await page.getByRole('button', { name: 'Chữ', exact: true }).click();
    await waitFor(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Sửa chữ'), 'ô "Sửa chữ"', 3000);
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Xin chào Windows');
    await page.getByRole('region', { name: /1 lớp/ }).click({ position: { x: 8, y: 8 } });
    await page.getByRole('region', { name: /Trang 1080×1080, 1 lớp/ }).waitFor({ timeout: 4000 });
    return 'gõ tiếng Việt bằng bàn phím máy tính';
  });

  await step('Thêm ảnh qua hộp chọn file của Windows', async () => {
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
    await page.getByRole('button', { name: 'Ảnh', exact: true }).click();
    await (await chooser).setFiles({ name: 'mau.png', mimeType: 'image/png', buffer: samplePng() });
    await page.getByRole('region', { name: /Trang 1080×1080, 2 lớp/ }).waitFor({ timeout: 8000 });
    return '';
  });

  await step('Không có nút "Tách nền" (chưa có trên máy tính)', async () => {
    const n = await page.getByRole('button', { name: 'Tách nền' }).count();
    if (n > 0) throw new Error('vẫn thấy nút Tách nền');
    return '';
  });

  await step('Xuất ảnh PNG → Ảnh\\Artio', async () => {
    const { msg, ms, sheet } = await exportAs('PNG');
    const f = await waitFor(() => newFiles('pictures', '.png')[0], 'file PNG mới trong Ảnh\\Artio', 5000);
    made.add(f);
    if (!head(f, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error('file không phải PNG');
    if (await sheet.getByRole('button', { name: 'Chia sẻ' }).count()) throw new Error('máy tính không nên có nút Chia sẻ');
    return `${ms} ms — ${msg} — ${path.basename(f)} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`;
  });

  await step('Nút "Mở thư mục" mở Explorer (không báo lỗi)', async () => {
    const sheet = exportSheet();
    await sheet.getByRole('button', { name: 'Mở thư mục' }).click();
    await sleep(1200);
    const t = await sheet.innerText();
    if (/Không mở được/.test(t)) throw new Error('app báo không mở được thư mục');
    await sheet.getByRole('button', { name: 'Đóng' }).click();
    return 'Explorer đã mở (bạn đóng cửa sổ đó sau)';
  });

  await step('Xuất lại cùng tên → không ghi đè, thêm " (2)"', async () => {
    const { sheet } = await exportAs('PNG');
    const list = await waitFor(() => (newFiles('pictures', '.png').length >= 2 ? newFiles('pictures', '.png') : null), '2 file PNG', 5000);
    list.forEach((f) => made.add(f));
    if (!/\(2\)\.png$/i.test(list[0])) throw new Error(`file mới tên lạ: ${path.basename(list[0])}`);
    await sheet.getByRole('button', { name: 'Đóng' }).click();
    return path.basename(list[0]);
  });

  await step('Xuất PDF để in → Tải xuống\\Artio', async () => {
    const { msg, ms, sheet } = await exportAs('PDF');
    const f = await waitFor(() => newFiles('downloads', '.pdf')[0], 'file PDF mới', 5000);
    made.add(f);
    if (head(f, 5).toString('latin1') !== '%PDF-') throw new Error('file không phải PDF');
    await sheet.getByRole('button', { name: 'Đóng' }).click();
    return `${ms} ms — ${msg}`;
  });

  await step('Lưu file .zunva → Tải xuống\\Artio, rồi mở lại thành bản sao', async () => {
    await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
    await nav('Dự án').click();
    await page.getByRole('button', { name: /^Lưu file \.zunva của dự án Bài mạng xã hội/ }).first().click();
    const f = await waitFor(() => newFiles('downloads', '.zunva')[0], 'file .zunva mới', 8000);
    made.add(f);
    if (head(f, 2).toString('latin1') !== 'PK') throw new Error('file .zunva hỏng');
    const before = await page.getByText(/Bài mạng xã hội/).count();
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
    await page.getByRole('button', { name: 'Mở file .zunva' }).click();
    await (await chooser).setFiles(f);
    await waitFor(async () => ((await page.getByText(/Bài mạng xã hội/).count()) > before ? true : null), 'dự án mở từ file', 8000);
    return `${path.basename(f)} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`;
  });

  await step('Tab Mẫu: 15 mẫu, ảnh hiện hết; mở "Thiệp cưới hoa hồng"', async () => {
    await nav('Mẫu').click();
    const grid = page.getByRole('list', { name: 'Danh sách mẫu' });
    await waitFor(async () => ((await grid.getByRole('button').count()) === 15 ? true : null), '15 mẫu', 5000);
    const imgs = grid.locator('img');
    for (let i = 0; i < 15; i++) await imgs.nth(i).scrollIntoViewIfNeeded();
    await waitFor(async () => ((await imgs.evaluateAll((els) => els.filter((e) => e.naturalWidth > 0).length)) === 15 ? true : null), 'ảnh thu nhỏ', 10000);
    const t0 = Date.now();
    await page.getByRole('button', { name: 'Mẫu Thiệp cưới hoa hồng' }).click();
    await page.getByRole('region', { name: /Trang 1748×2480, 6 lớp/ }).waitFor({ timeout: 8000 });
    createdProjects.push(projectId());
    await sleep(1200);
    return `mở mẫu sau ${((Date.now() - t0) / 1000).toFixed(1)} s`;
  });

  await step('Hình nền điện thoại: không có "Đặt làm hình nền" trên máy tính', async () => {
    await home();
    await page.locator('.starts').getByRole('button', { name: 'Hình nền điện thoại' }).click();
    await page.getByRole('dialog', { name: 'Chọn mẫu Hình nền điện thoại' }).getByRole('button', { name: 'Trang trắng' }).click();
    await page.getByRole('region', { name: /Trang 1080×2340, 0 lớp/ }).waitFor({ timeout: 6000 });
    createdProjects.push(projectId());
    await page.getByRole('button', { name: 'Xuất', exact: true }).click();
    await exportSheet().waitFor({ timeout: 3000 });
    if (await exportSheet().getByRole('group', { name: 'Đặt làm hình nền' }).count()) throw new Error('vẫn có nút Đặt làm hình nền');
    await exportSheet().getByRole('button', { name: 'Đóng' }).click();
    return 'khổ 1080×2340';
  });

  await step('Tắt app, mở lại → dự án vẫn còn (lưu bền)', async () => {
    const id = createdProjects[0];
    await home();
    await browser.close().catch(() => {});
    await launchAndConnect(exe);
    await nav('Dự án').click();
    const has = await page.evaluate(
      (id) =>
        new Promise((res) => {
          const r = indexedDB.open('c87');
          r.onsuccess = () => {
            const g = r.result.transaction('projects').objectStore('projects').get(id);
            g.onsuccess = () => res(!!g.result);
            g.onerror = () => res(false);
          };
          r.onerror = () => res(false);
        }),
      id,
    );
    if (!has) throw new Error('mở lại app thì mất dự án thử');
    return `còn dự án ${id}`;
  });
}

async function cleanup() {
  // Xóa dự án thử (cả bản mở từ .zunva: tên "Bài mạng xã hội" tạo trong lúc kiểm tra) và file thử.
  try {
    if (page) {
      await page.evaluate(
        async ({ ids, since }) => {
          const db = await new Promise((res) => { const r = indexedDB.open('c87'); r.onsuccess = () => res(r.result); });
          const all = await new Promise((res) => { const g = db.transaction('projects').objectStore('projects').getAll(); g.onsuccess = () => res(g.result); });
          const doomed = all.filter((p) => ids.includes(p?.doc?.id) || (p?.doc?.createdAt >= since && /^Bài mạng xã hội/.test(p?.doc?.name ?? ''))).map((p) => p.doc.id);
          for (const id of doomed) {
            await new Promise((res) => {
              const tx = db.transaction(['projects', 'assets'], 'readwrite');
              tx.objectStore('assets').delete(`thumb_${id}`);
              const g = tx.objectStore('projects').get(id);
              g.onsuccess = () => {
                // Ảnh mẫu (mau-anh-…) dùng chung với dự án của bạn: không xóa.
                for (const a of Object.keys(g.result?.doc?.assets ?? {})) if (!a.startsWith('mau-anh-')) tx.objectStore('assets').delete(a);
                tx.objectStore('projects').delete(id);
              };
              tx.oncomplete = res;
              tx.onerror = res;
            });
          }
          db.close();
        },
        { ids: createdProjects.filter(Boolean), since: started - 2000 },
      );
    }
  } catch {}
  for (const f of made) {
    try { fs.unlinkSync(f); } catch {}
  }
  try { await browser?.close(); } catch {}
  try { execFileSync('taskkill', ['/IM', exeName, '/F'], { stdio: 'ignore' }); } catch {}
}

function writeReport(fatal) {
  const passed = steps.filter((s) => s.ok).length;
  const lines = [
    `# Artio — kết quả tự kiểm tra bản Windows`,
    ``,
    `Thời điểm: ${new Date().toLocaleString('vi-VN')}  `,
    `Kết quả: **${passed}/${steps.length} bước đạt**${fatal ? `  \nDừng giữa chừng: ${fatal}` : ''}`,
    ``,
    `| # | Bước | Kết quả | Chi tiết | Thời gian | Ảnh |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...steps.map((s, i) => `| ${i + 1} | ${s.name} | ${s.ok ? 'ĐẠT' : '**LỖI**'} | ${s.detail.replace(/\|/g, '/')} | ${(s.ms / 1000).toFixed(1)}s | ${s.shot ?? ''} |`),
  ];
  fs.writeFileSync(path.join(out, 'bao-cao.md'), lines.join('\n'));
  fs.writeFileSync(path.join(out, 'ket-qua.json'), JSON.stringify({ steps, fatal: fatal ?? null }, null, 2));
}

let fatal;
try {
  await main();
} catch (e) {
  fatal = String(e?.message ?? e).split('\n')[0];
  console.log(`DỪNG: ${fatal}`);
}
await cleanup();
writeReport(fatal);
console.log(`\n${steps.filter((s) => s.ok).length}/${steps.length} bước đạt. Báo cáo: ${path.join(out, 'bao-cao.md')}`);
process.exit(0);
