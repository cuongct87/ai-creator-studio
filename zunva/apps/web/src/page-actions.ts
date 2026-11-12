/**
 * Thao tác với trang (G3 R3): thêm, nhân đôi, xóa, đổi thứ tự. Hàm thuần trả `Op[]` của lõi để mọi
 * thay đổi đi qua lịch sử (mỗi thao tác = 1 bước hoàn tác).
 */
import { createPage, type DesignDocument, type Id, type Layer, type Op } from '@zunva/core';

type IdMaker = (prefix: string) => Id;

/** Thêm trang trắng cùng khổ ngay sau trang `afterId`. */
export function addPageOps(doc: DesignDocument, afterId: Id, newId: IdMaker): { ops: Op[]; pageId: Id } {
  const index = doc.pages.findIndex((p) => p.id === afterId);
  const base = doc.pages[index] ?? doc.pages[0]!;
  const page = createPage(newId('page'), base.width, base.height);
  return { ops: [{ op: 'addPage', index: index + 1, page }], pageId: page.id };
}

/** Bản sao của trang (ID mới cho trang và từng lớp, ảnh dùng chung), đặt ngay sau trang gốc. */
export function duplicatePageOps(doc: DesignDocument, pageId: Id, newId: IdMaker): { ops: Op[]; pageId: Id } | null {
  const index = doc.pages.findIndex((p) => p.id === pageId);
  const source = doc.pages[index];
  if (!source) return null;
  const page = {
    ...source,
    id: newId('page'),
    background: { ...source.background },
    layers: source.layers.map((l) => ({ ...l, id: newId('layer') }) as Layer),
  };
  return { ops: [{ op: 'addPage', index: index + 1, page }], pageId: page.id };
}

/** Xóa trang. Trang cuối cùng không xóa được → null. Trả kèm trang sẽ mở sau khi xóa. */
export function removePageOps(doc: DesignDocument, pageId: Id): { ops: Op[]; nextPageId: Id } | null {
  if (doc.pages.length <= 1) return null;
  const index = doc.pages.findIndex((p) => p.id === pageId);
  if (index < 0) return null;
  const next = doc.pages[index + 1] ?? doc.pages[index - 1]!;
  return { ops: [{ op: 'removePage', pageId }], nextPageId: next.id };
}

/** Đưa trang lên (-1) hoặc xuống (+1). Đã ở đầu/cuối → []. */
export function movePageOps(doc: DesignDocument, pageId: Id, step: -1 | 1): Op[] {
  const index = doc.pages.findIndex((p) => p.id === pageId);
  const to = index + step;
  if (index < 0 || to < 0 || to >= doc.pages.length) return [];
  return [{ op: 'movePage', pageId, toIndex: to }];
}
