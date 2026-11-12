/**
 * Trang phụ cho scripts/anh-thu-nho-mau.mjs: vẽ từng mẫu bằng đúng trình vẽ của app
 * (renderPageImage, phông thật) rồi trả ảnh WebP. Không nằm trong bản build của app.
 */
import { renderPageImage } from '@zunva/editor-canvas';
import { buildTemplateDocument, templateAssetId } from '../src/mau/dung-mau';
import { TEMPLATES } from '../src/mau/kho-mau';

/** Ảnh thu nhỏ: rộng tối đa 480 px, cao tối đa 640 px. */
const MAX_W = 480;
const MAX_H = 640;

async function toWebp(png: Blob): Promise<string> {
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const url = canvas.toDataURL('image/webp', 0.86);
  if (!url.startsWith('data:image/webp;base64,')) throw new Error('Trình duyệt không mã hóa được WebP');
  return url.slice('data:image/webp;base64,'.length);
}

async function veMau(): Promise<Array<{ id: string; webp: string }>> {
  const out: Array<{ id: string; webp: string }> = [];
  for (const t of TEMPLATES) {
    const doc = buildTemplateDocument(t);
    const png = await renderPageImage(doc, doc.pages[0]!.id, {
      pixelRatio: Math.min(MAX_W / t.width, MAX_H / t.height),
      mimeType: 'image/png',
      assetUrl: (id) => (id === templateAssetId(t) ? `/mau/anh/${t.id}.jpg` : undefined),
    });
    out.push({ id: t.id, webp: await toWebp(png) });
  }
  return out;
}

(window as unknown as { veMau: typeof veMau }).veMau = veMau;
