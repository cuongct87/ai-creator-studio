import {
  cloneDocumentForTemplate,
  createDocument,
  createImageLayer,
  createPage,
  createShapeLayer,
  createTextLayer,
  type DesignDocument,
  type IdFactory,
  type Layer,
} from '@zunva/core';
import type { ProjectStore } from '@zunva/platform';
import type { CreateResult } from '../create-project';
import { normalizeVi, START_OPTIONS } from '../start-options';
import { templateImageUrl, TEMPLATES, type TemplateSpec, type TemplateText } from './kho-mau';

/** ID cố định của ảnh mẫu: mở mẫu nhiều lần, kho chỉ lưu ảnh một lần. */
export const templateAssetId = (spec: TemplateSpec) => `mau-anh-${spec.id}`;
/** ID tài liệu mẫu gốc (ghi vào `meta.templateId` của dự án tạo từ mẫu). */
export const templateDocId = (spec: TemplateSpec) => `mau-${spec.id}`;

/** Ước lượng chiều cao khung chữ (Konva tự xuống dòng theo bề ngang; chiều cao chỉ để chọn/kéo). */
export function estimateTextHeight(item: Pick<TemplateText, 'text' | 'width' | 'fontSize' | 'lineHeight' | 'letterSpacing'>): number {
  const charWidth = item.fontSize * 0.52 + item.letterSpacing;
  const perLine = Math.max(1, Math.floor(item.width / charWidth));
  const lines = item.text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return Math.round(lines * item.fontSize * item.lineHeight);
}

/** Dựng tài liệu mẫu gốc từ mô tả (ID cố định, lặp lại được). */
export function buildTemplateDocument(spec: TemplateSpec): DesignDocument {
  const assetId = templateAssetId(spec);
  const layers: Layer[] = [];
  if (spec.picture) {
    layers.push(createImageLayer(`${spec.id}-anh`, assetId, { ...spec.picture, name: 'Ảnh minh họa' }));
  }
  spec.items.forEach((item, i) => {
    const id = `${spec.id}-${i + 1}`;
    if (item.type === 'text') {
      const { text, x, y, width, fontFamily, fontSize, fontWeight, italic, color, align, lineHeight, letterSpacing } = item;
      layers.push(
        createTextLayer(id, {
          text, x, y, width, fontFamily, fontSize, fontWeight, italic, color, align, lineHeight, letterSpacing,
          height: estimateTextHeight(item),
        }),
      );
    } else {
      const { shape, x, y, width, height, fill, stroke, strokeWidth, cornerRadius } = item;
      layers.push(createShapeLayer(id, { shape, x, y, width, height, fill, stroke, strokeWidth, cornerRadius }));
    }
  });
  const page = createPage(`${spec.id}-trang`, spec.width, spec.height, {
    background: { color: spec.background, imageAssetId: spec.picture ? null : assetId, imageOpacity: 1 },
    layers,
  });
  return createDocument(templateDocId(spec), page, 0, {
    name: spec.title,
    meta: { kind: spec.kind, locale: 'vi', templateId: null },
    assets: {
      [assetId]: {
        id: assetId,
        kind: 'image',
        mimeType: 'image/jpeg',
        name: `${spec.id}.jpg`,
        hash: null,
        width: spec.image.width,
        height: spec.image.height,
      },
    },
  });
}

export interface OpenTemplateDeps {
  newId: IdFactory;
  now: number;
  /** Đọc byte ảnh mẫu (fetch trong app); null = không đọc được. */
  loadImage(url: string): Promise<Uint8Array | null>;
  /** Kích thước màn hình máy (Android) cho mẫu hình nền; null = giữ khổ mẫu. */
  screen: { width: number; height: number } | null;
}

/**
 * Chọn mẫu → dự án mới là bản sao (mẫu gốc không đổi), lưu vào kho.
 * Ảnh mẫu đã có trong kho thì dùng lại, không chép thêm.
 */
export async function openTemplate(store: ProjectStore, spec: TemplateSpec, deps: OpenTemplateDeps): Promise<CreateResult> {
  const assetId = templateAssetId(spec);
  const have = await store.getAsset(assetId);
  if (!have.ok) {
    const bytes = await deps.loadImage(templateImageUrl(spec.id));
    if (!bytes) return { ok: false, error: 'Không mở được ảnh của mẫu này. Hãy thử lại.' };
    const put = await store.putAsset(assetId, 'image/jpeg', bytes);
    if (!put.ok) return { ok: false, error: put.error };
  }
  const doc = cloneDocumentForTemplate(buildTemplateDocument(spec), deps.newId, deps.now);
  // Hình nền chỉ có ảnh phủ kín trang: đổi khổ theo đúng màn hình máy, ảnh tự phủ lại.
  if (spec.kind === 'wallpaper' && spec.items.length === 0 && !spec.picture && deps.screen) {
    const first = doc.pages[0]!;
    doc.pages[0] = { ...first, width: deps.screen.width, height: deps.screen.height };
  }
  const saved = await store.save(doc);
  return saved.ok ? { ok: true, id: doc.id } : { ok: false, error: saved.error };
}

/** Các loại có mẫu, theo thứ tự trang chủ. */
export const TEMPLATE_KINDS: ReadonlyArray<{ kind: string; label: string }> = START_OPTIONS.filter((o) =>
  TEMPLATES.some((t) => t.kind === o.kind),
).map((o) => ({ kind: o.kind, label: o.label }));

/** Lọc mẫu theo loại (null = tất cả) và ô tìm (gõ không dấu vẫn ra). */
export function searchTemplates(query: string, kind: string | null, templates: readonly TemplateSpec[] = TEMPLATES): TemplateSpec[] {
  const words = normalizeVi(query).split(' ').filter((w) => w !== '');
  const kindLabel = (k: string) => START_OPTIONS.find((o) => o.kind === k)?.label ?? '';
  return templates.filter((t) => {
    if (kind !== null && t.kind !== kind) return false;
    if (words.length === 0) return true;
    // Khớp đầu từ: "hoa" ra "hoa cúc" nhưng không ra "điện thoại".
    const haystack = normalizeVi([t.title, kindLabel(t.kind), ...t.tags].join(' ')).split(' ');
    return words.every((w) => haystack.some((h) => h.startsWith(w)));
  });
}
