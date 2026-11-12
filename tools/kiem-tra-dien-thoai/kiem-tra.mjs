// Artio — tự kiểm tra trên điện thoại thật (S24+) qua dây USB.
// Chạy bằng file "chay-kiem-tra.bat" (bấm đúp). Cần: bản APK kiểm tra, bật Gỡ lỗi USB.
// Kết quả: kiem-tra-dien-thoai/ket-qua/<thời điểm>/  (bao-cao.md, ket-qua.json, ảnh từng bước, video).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const PKG = 'vn.c87.lsc';
const ACTIVITY = 'vn.iaysystem.aicreatorstudio.MainActivity';
const FIT_MARGIN = 0.92; // giống editor-canvas/geometry.ts
const VIDEO_ON_PHONE = '/sdcard/artio-kiem-tra.mp4';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const out = path.join(here, 'ket-qua', stamp);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(here, 'ket-qua', 'moi-nhat.txt'), out);

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
let device;
let page;
let shotNo = 0;

async function shot(name) {
  shotNo += 1;
  const file = `${String(shotNo).padStart(2, '0')}-${name}.png`;
  try {
    await device.screenshot({ path: path.join(out, file) });
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
  const file = await shot(name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40));
  steps.push({ name, ok, detail, ms: Date.now() - t0, shot: file });
  console.log(`${ok ? 'ĐẠT ' : 'LỖI '} ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

async function waitFor(check, what, timeout = 4000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await check();
    if (last) return last;
    await sleep(150);
  }
  throw new Error(`hết ${timeout / 1000}s mà chưa thấy: ${what}`);
}

// ---------- chạm: gửi chạm thật vào WebView qua Chrome DevTools (không cần cài thêm gì lên máy) ----------
let cdp;
async function touch(type, points) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((p, i) => ({ x: p.x, y: p.y, id: i + 1, radiusX: 6, radiusY: 6, force: 1 })),
  });
}
async function tapCss(p) {
  await touch('touchStart', [p]);
  await sleep(60);
  await touch('touchEnd', []);
  await sleep(120);
}
async function dragCss(from, to, steps = 20) {
  await touch('touchStart', [from]);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }]);
    await sleep(16);
  }
  await touch('touchEnd', []);
  await sleep(150);
}
/** Hai ngón đặt ngang qua `center`, cách nhau d0 → kéo ra cách nhau d1 (CSS px). */
async function pinchCss(center, d0, d1, steps = 20) {
  const at = (d) => [{ x: center.x - d / 2, y: center.y }, { x: center.x + d / 2, y: center.y }];
  await touch('touchStart', [at(d0)[0]]);
  await sleep(30);
  await touch('touchStart', at(d0));
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', at(d0 + ((d1 - d0) * i) / steps));
    await sleep(16);
  }
  await touch('touchEnd', [at(d1)[0]]);
  await sleep(30);
  await touch('touchEnd', []);
  await sleep(150);
}
async function tap(locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  const box = await locator.boundingBox({ timeout: 4000 });
  if (!box) throw new Error('không thấy nút để bấm');
  await tapCss({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
}

/** Vị trí trang trên màn hình (CSS px) khi đang "Vừa màn hình". */
async function pageView(doc) {
  const wrap = await page.getByLabel('Trang thiết kế').boundingBox();
  const pg = doc.pages[0];
  const s = Math.min(wrap.width / pg.width, wrap.height / pg.height) * FIT_MARGIN;
  return { s, ox: wrap.x + (wrap.width - pg.width * s) / 2, oy: wrap.y + (wrap.height - pg.height * s) / 2, wrap };
}
function layerPoint(l, u, v) {
  const a = (l.rotation * Math.PI) / 180;
  return { x: l.x + u * Math.cos(a) - v * Math.sin(a), y: l.y + u * Math.sin(a) + v * Math.cos(a) };
}
const css = (view, p) => ({ x: view.ox + p.x * view.s, y: view.oy + p.y * view.s });

// ---------- đọc dự án đã lưu (IndexedDB "c87") ----------
const projectId = () => new URL(page.url()).searchParams.get('project');
async function readDoc() {
  const id = projectId();
  return page.evaluate(async (id) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('c87');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const rec = await new Promise((res, rej) => {
      const g = db.transaction('projects').objectStore('projects').get(id);
      g.onsuccess = () => res(g.result);
      g.onerror = () => rej(g.error);
    });
    db.close();
    return rec ? rec.doc : null;
  }, id);
}
const waitDoc = (pred, what, timeout = 6000) => waitFor(async () => { const d = await readDoc(); return d && pred(d) ? d : null; }, what, timeout);
const layersOf = (d) => d.pages[0].layers;
const textLayer = (d) => layersOf(d).find((l) => l.type === 'text');


/** Ảnh mẫu tự tạo (không cần ảnh của bạn): nền xám nhạt, hình tròn đỏ ở giữa — "chủ thể" cho tách nền. */
function samplePng(w = 600, h = 600) {
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
      raw.set(inside ? [210, 30, 40] : [225, 228, 232], y * (w * 3 + 1) + 1 + x * 3);
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const imageLayer = (d) => layersOf(d).find((l) => l.type === 'image');

async function keyboardShown() {
  const s = (await device.shell('dumpsys input_method')).toString();
  const m = /mInputShown=(true|false)/.exec(s) || /isInputViewShown=(true|false)/.exec(s);
  return m ? m[1] === 'true' : null;
}
async function tapEmptyCorner() {
  const wrap = await page.getByLabel('Trang thiết kế').boundingBox();
  await tapCss({ x: wrap.x + 8, y: wrap.y + 8 });
}
async function fit() {
  const b = page.getByRole('button', { name: 'Vừa màn hình' });
  if (await b.isVisible()) await tap(b);
  await sleep(400);
}

async function main() {
  const { _android } = loadPlaywright();
  const devices = await _android.devices();
  if (devices.length === 0) throw new Error('Không thấy điện thoại. Kiểm tra dây USB, "Gỡ lỗi USB" và bấm "Cho phép" trên điện thoại.');
  device = devices[0];
  console.log(`Điện thoại: ${await device.model()} (${device.serial()})`);
  const installed = (await device.shell(`pm list packages ${PKG}`)).toString();
  if (!installed.includes(PKG)) throw new Error('Điện thoại chưa cài Artio. Cài bản APK kiểm tra trước.');

  const recording = device.shell(`screenrecord --bit-rate 4000000 --time-limit 180 ${VIDEO_ON_PHONE}`).catch(() => null);

  const opened = await step('Mở app Artio', async () => {
    await device.shell(`am force-stop ${PKG}`);
    await device.shell(`am start -n ${PKG}/${ACTIVITY}`);
    let wv;
    try {
      wv = await device.webView({ pkg: PKG }, { timeout: 15000 });
    } catch {
      throw new Error('Không điều khiển được app: bản Artio trên máy chưa phải BẢN KIỂM TRA (artio-ban-kiem-tra-apk).');
    }
    page = await wv.page();
    cdp = await page.context().newCDPSession(page);
    await page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' }).waitFor({ timeout: 10000 });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) throw new Error(`trang chủ bị cuộn ngang ${over}px`);
    return `màn hình ${await page.evaluate(() => `${innerWidth}×${innerHeight} css, tỉ lệ ${devicePixelRatio}`)}`;
  });
  if (!opened) return finish(recording);

  await step('Tạo thiết kế "Mạng xã hội" 1080×1080', async () => {
    await tap(page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }));
    await page.getByRole('region', { name: /Trang 1080×1080, 0 lớp/ }).waitFor({ timeout: 6000 });
    return `dự án thử ${projectId()}`;
  });

  await step('Bấm "Chữ" → ô gõ và bàn phím hiện ngay (không chạm thêm)', async () => {
    const t0 = Date.now();
    await tap(page.getByRole('button', { name: 'Chữ', exact: true }));
    await waitFor(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Sửa chữ'), 'ô "Sửa chữ" được chọn', 3000);
    const focusMs = Date.now() - t0;
    let kb = null;
    try {
      kb = await waitFor(async () => ((await keyboardShown()) ? true : null), 'bàn phím', 2500);
    } catch {
      kb = await keyboardShown();
    }
    if (kb === false) throw new Error(`ô gõ mở sau ${focusMs} ms nhưng bàn phím KHÔNG hiện`);
    return `ô gõ mở sau ${focusMs} ms; bàn phím: ${kb === null ? 'không đọc được trạng thái' : 'có hiện'}`;
  });

  await step('Gõ tiếng Việt "Xin chào Việt Nam", chạm ra ngoài để xong', async () => {
    await page.getByRole('textbox', { name: 'Sửa chữ' }).fill('Xin chào Việt Nam');
    await sleep(500);
    await tapEmptyCorner();
    const d = await waitDoc((d) => textLayer(d)?.text === 'Xin chào Việt Nam', 'chữ được lưu');
    return `đã lưu, cỡ chữ ${textLayer(d).fontSize}`;
  });

  await step('Chạm 1 lần chọn chữ, chạm thêm 1 lần → mở ô gõ (F1)', async () => {
    await fit();
    let d = await readDoc();
    let v = await pageView(d);
    const t = textLayer(d);
    await tapCss(css(v, layerPoint(t, t.width / 2, t.height / 2)));
    await page.getByLabel(/^Nội dung/).waitFor({ timeout: 3000 });
    await sleep(700); // bảng thuộc tính hiện → trang tự thu lại cho vừa
    v = await pageView(d);
    await tapCss(css(v, layerPoint(t, t.width / 2, t.height / 2)));
    await page.getByRole('textbox', { name: 'Sửa chữ' }).waitFor({ timeout: 3000 });
    await sleep(500);
    await tapEmptyCorner();
    await sleep(600);
    return 'mở ô gõ bằng 1 lần chạm';
  });

  async function selectText() {
    await fit();
    const d = await readDoc();
    const v = await pageView(d);
    const t = textLayer(d);
    if (!(await page.getByLabel(/^Nội dung/).isVisible())) {
      await tapCss(css(v, layerPoint(t, t.width / 2, t.height / 2)));
      await page.getByLabel(/^Nội dung/).waitFor({ timeout: 3000 });
      await sleep(700);
    }
    return { d: await readDoc(), v: await pageView(d) };
  }

  await step('1 ngón kéo chữ → di chuyển', async () => {
    const { d, v } = await selectText();
    const t = textLayer(d);
    const from = css(v, layerPoint(t, t.width / 2, t.height / 2));
    await dragCss(from, { x: from.x, y: from.y + 60 });
    const d2 = await waitDoc((x) => Math.abs(textLayer(x).y - t.y) > 20, 'chữ dời xuống');
    return `y: ${t.y} → ${textLayer(d2).y}`;
  });

  let fs0 = 0;
  await step('2 ngón phóng to chữ đang chọn (cỡ chữ số chẵn, không nghiêng)', async () => {
    const { d } = await selectText();
    const t = textLayer(d);
    fs0 = t.fontSize;
    const wrap = await page.getByLabel('Trang thiết kế').boundingBox();
    // Hai ngón đặt ở vùng trang (không cần trúng chữ), kéo ra từ 80 → 200 px.
    await pinchCss({ x: wrap.x + wrap.width / 2, y: wrap.y + wrap.height * 0.75 }, 80, 200);
    const d2 = await waitDoc((x) => textLayer(x).fontSize > t.fontSize, 'cỡ chữ tăng');
    const t2 = textLayer(d2);
    if (!Number.isInteger(t2.fontSize)) throw new Error(`cỡ chữ lẻ: ${t2.fontSize}`);
    if (t2.rotation !== 0) throw new Error(`chữ bị nghiêng ${t2.rotation}° sau khi phóng`);
    return `cỡ ${t.fontSize} → ${t2.fontSize}, góc ${t2.rotation}°`;
  });

  await step('Hoàn tác 1 lần → về đúng cỡ cũ (cả cử chỉ = 1 bước)', async () => {
    await tap(page.getByRole('button', { name: /^Hoàn tác/ }));
    const d = await waitDoc((x) => textLayer(x).fontSize === fs0, `cỡ chữ về ${fs0}`);
    return `cỡ ${textLayer(d).fontSize}`;
  });

  await step('Giữ nút ↻ ở góc rồi xoay 35°', async () => {
    const { d, v } = await selectText();
    const t = textLayer(d);
    const c = layerPoint(t, t.width / 2, t.height / 2);
    // Lớp mỏng (chữ 1 dòng): nút ↻ được đẩy ra ngoài theo đường chéo để các nút cách nhau ≥ 44 px (K6).
    const off = Math.max(0, (88 - Math.min(t.width * v.s, t.height * v.s)) / 2) / v.s;
    const corner = layerPoint(t, t.width + off, -off);
    const a = (35 * Math.PI) / 180;
    const dx = corner.x - c.x;
    const dy = corner.y - c.y;
    const target = { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
    await dragCss(css(v, corner), css(v, target), 30);
    const d2 = await waitDoc((x) => Math.abs(textLayer(x).rotation - t.rotation) > 5, 'chữ xoay');
    const t2 = textLayer(d2);
    if (Math.abs(t2.width - t.width) > 1) throw new Error(`xoay mà khung đổi cỡ: ${t.width} → ${t2.width}`);
    await tap(page.getByRole('button', { name: /^Hoàn tác/ }));
    return `góc ${t.rotation}° → ${t2.rotation}° (mong đợi khoảng 35°), cỡ khung giữ nguyên; đã hoàn tác`;
  });

  await step('Thêm chữ rồi xóa hết → không sót lớp "Chữ trống"', async () => {
    await tapEmptyCorner();
    await sleep(500);
    await tap(page.getByRole('button', { name: 'Chữ', exact: true }));
    const box = page.getByRole('textbox', { name: 'Sửa chữ' });
    await box.waitFor({ timeout: 3000 });
    await box.fill('');
    await sleep(500);
    await tapEmptyCorner();
    await page.getByRole('region', { name: /, 1 lớp/ }).waitFor({ timeout: 4000 });
    return 'còn đúng 1 lớp';
  });

  // ---------- G2b: ghép ảnh ----------
  const imageOk = await step('Thêm ảnh (ảnh mẫu tự tạo, không mở thư viện ảnh)', async () => {
    await tapEmptyCorner();
    await sleep(500);
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
    await tap(page.getByRole('button', { name: 'Ảnh', exact: true }));
    await (await chooser).setFiles({ name: 'mau.png', mimeType: 'image/png', buffer: samplePng() });
    const d = await waitDoc((x) => !!imageLayer(x), 'lớp ảnh', 8000);
    return `ảnh ${imageLayer(d).width}×${imageLayer(d).height}`;
  });

  if (imageOk) {
    await step('Hòa trộn: chọn "Nhân (tối đi)"', async () => {
      await page.getByLabel('Hòa trộn').selectOption('multiply');
      await waitDoc((x) => imageLayer(x).blendMode === 'multiply', 'lưu kiểu hòa trộn');
      return '';
    });

    await step('Mờ viền 40', async () => {
      await page.getByLabel(/^Mờ viền/).fill('40');
      await waitDoc((x) => imageLayer(x).feather === 40, 'lưu mờ viền');
      return '';
    });

    await step('Tẩy: 1 ngón kéo ngang giữa ảnh → 1 bước hoàn tác "Tẩy"', async () => {
      await tap(page.getByRole('button', { name: 'Tẩy', exact: true }));
      await page.getByLabel('Chế độ tẩy').waitFor({ timeout: 3000 });
      const wrap = await page.getByLabel('Trang thiết kế').boundingBox();
      const c = { x: wrap.x + wrap.width / 2, y: wrap.y + wrap.height / 2 };
      const t0 = Date.now();
      await dragCss({ x: c.x - 50, y: c.y }, { x: c.x + 50, y: c.y }, 25);
      const d = await waitDoc((x) => imageLayer(x).maskAssetId !== null, 'lưu vùng tẩy', 8000);
      await page.getByRole('button', { name: /^Hoàn tác: Tẩy/ }).waitFor({ timeout: 3000 });
      await tap(page.getByLabel('Chế độ tẩy').getByRole('button', { name: 'Xong' }));
      return `lưu vùng tẩy sau ${Date.now() - t0} ms (${imageLayer(d).maskAssetId})`;
    });

    await step('Tách nền (ML Kit trên máy)', async () => {
      const btn = page.getByRole('button', { name: 'Tách nền', exact: true });
      if (!(await btn.isVisible())) throw new Error('không thấy nút "Tách nền" (bản app chưa có tách nền?)');
      const before = imageLayer(await readDoc()).maskAssetId;
      const t0 = Date.now();
      await tap(btn);
      const end = Date.now() + 120000;
      while (Date.now() < end) {
        const d = await readDoc();
        if (imageLayer(d).maskAssetId !== before) return `tách xong sau ${((Date.now() - t0) / 1000).toFixed(1)} giây`;
        const msg = page.locator('.editor-message');
        if (await msg.isVisible()) {
          const text = (await msg.textContent())?.trim() ?? '';
          if (text.startsWith('Máy đang tải bộ tách nền') && Date.now() < end - 15000) {
            // Lần đầu: Google Play services còn đang tải mô hình. Chờ rồi bấm lại.
            await sleep(10000);
            await tap(btn);
            continue;
          }
          if (text && text !== 'Đang tách nền…') throw new Error(`app báo: "${text}"`);
        }
        await sleep(300);
      }
      throw new Error('hết 120 giây chưa xong');
    });

    await step('Bỏ hết vùng tẩy', async () => {
      await tap(page.getByRole('button', { name: 'Bỏ hết vùng tẩy', exact: true }));
      await waitDoc((x) => imageLayer(x).maskAssetId === null, 'bỏ vùng tẩy');
      return '';
    });
  }

  await step('Nút Back của Android → về trang chủ', async () => {
    await device.shell('input keyevent 4');
    await page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' }).waitFor({ timeout: 5000 });
    return '';
  });

  await finish(recording);
}

async function finish(recording) {
  // Xóa dự án thử để không lẫn vào dự án của founder.
  try {
    const id = projectId();
    if (page && id) {
      await page.evaluate(async (id) => {
        const db = await new Promise((res) => { const r = indexedDB.open('c87'); r.onsuccess = () => res(r.result); });
        await new Promise((res) => {
          const tx = db.transaction(['projects', 'assets'], 'readwrite');
          tx.objectStore('assets').delete(`thumb_${id}`);
          const g = tx.objectStore('projects').get(id);
          g.onsuccess = () => {
            for (const a of Object.keys(g.result?.doc?.assets ?? {})) tx.objectStore('assets').delete(a);
            tx.objectStore('projects').delete(id);
          };
          tx.oncomplete = res;
          tx.onerror = res;
        });
        db.close();
      }, id);
    }
  } catch {}
  try {
    await device?.shell('pkill -2 screenrecord');
    await Promise.race([recording, sleep(4000)]);
  } catch {}
  writeReport();
  try { await device?.close(); } catch {}
}

function writeReport(fatal) {
  const passed = steps.filter((s) => s.ok).length;
  const lines = [
    `# Artio — kết quả tự kiểm tra trên điện thoại`,
    ``,
    `Thời điểm: ${new Date().toLocaleString('vi-VN')}  `,
    `Kết quả: **${passed}/${steps.length} bước đạt**${fatal ? `  \nDừng giữa chừng: ${fatal}` : ''}`,
    ``,
    `| # | Bước | Kết quả | Chi tiết | Thời gian | Ảnh |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...steps.map((s, i) => `| ${i + 1} | ${s.name} | ${s.ok ? 'ĐẠT' : '**LỖI**'} | ${s.detail.replace(/\|/g, '/')} | ${(s.ms / 1000).toFixed(1)}s | ${s.shot ?? ''} |`),
    ``,
    `Video cả buổi: video.mp4 (nếu có).`,
  ];
  fs.writeFileSync(path.join(out, 'bao-cao.md'), lines.join('\n'));
  fs.writeFileSync(path.join(out, 'ket-qua.json'), JSON.stringify({ fatal: fatal ?? null, steps }, null, 2));
  console.log(`\n${passed}/${steps.length} bước đạt. Báo cáo: ${path.join(out, 'bao-cao.md')}`);
}

main().catch((e) => {
  const msg = String(e?.message ?? e).split('\n')[0];
  console.log(`\nDỪNG: ${msg}`);
  writeReport(msg);
  process.exitCode = 1;
});
