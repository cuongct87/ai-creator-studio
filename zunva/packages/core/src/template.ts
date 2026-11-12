import type { DesignDocument, Id, Layer, Page } from './model';

/** Tạo ID mới theo tiền tố (ví dụ newId('layer')). */
export type IdFactory = (prefix: string) => Id;

/**
 * Bản sao của một mẫu để thành dự án mới: ID mới cho tài liệu, trang, lớp (sửa dự án không
 * đụng mẫu gốc). Ảnh giữ nguyên ID — ảnh mẫu dùng chung, kho chỉ lưu một lần.
 * `meta.templateId` ghi ID mẫu gốc.
 */
export function cloneDocumentForTemplate(template: DesignDocument, newId: IdFactory, now: number): DesignDocument {
  const pages: Page[] = template.pages.map((page) => ({
    ...page,
    id: newId('page'),
    background: { ...page.background },
    layers: page.layers.map((layer) => ({ ...layer, id: newId('layer') }) as Layer),
  }));
  return {
    ...template,
    id: newId('doc'),
    createdAt: now,
    updatedAt: now,
    pages,
    assets: { ...template.assets },
    meta: { ...template.meta, templateId: template.id },
  };
}
