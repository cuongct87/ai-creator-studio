import type {
  DesignDocument,
  Id,
  ImageLayer,
  Page,
  ShapeLayer,
  TextLayer,
} from './model';
import { SCHEMA_VERSION } from './model';

/**
 * Hàm tạo phần tử với giá trị mặc định hợp lệ. Nhận ID và thời điểm từ ngoài vào
 * để lõi không phụ thuộc đồng hồ hay nguồn ngẫu nhiên (dễ test, dễ tái tạo).
 */

const layerDefaults = {
  name: null,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
  timing: null,
  animation: null,
} as const;

export function createTextLayer(
  id: Id,
  init: Partial<Omit<TextLayer, 'id' | 'type'>> = {},
): TextLayer {
  return {
    ...layerDefaults,
    x: 0,
    y: 0,
    width: 600,
    height: 80,
    text: 'Chữ mới',
    fontFamily: 'Be Vietnam Pro',
    fontSize: 64,
    fontWeight: 700,
    italic: false,
    color: '#0d1422',
    align: 'center',
    lineHeight: 1.25,
    letterSpacing: 0,
    ...init,
    id,
    type: 'text',
  };
}

export function createImageLayer(
  id: Id,
  assetId: Id,
  init: Partial<Omit<ImageLayer, 'id' | 'type' | 'assetId'>> = {},
): ImageLayer {
  return {
    ...layerDefaults,
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    crop: null,
    cornerRadius: 0,
    flipX: false,
    flipY: false,
    ...init,
    id,
    type: 'image',
    assetId,
  };
}

export function createShapeLayer(
  id: Id,
  init: Partial<Omit<ShapeLayer, 'id' | 'type'>> = {},
): ShapeLayer {
  return {
    ...layerDefaults,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    shape: 'rect',
    fill: '#0d8799',
    stroke: null,
    strokeWidth: 0,
    cornerRadius: 0,
    ...init,
    id,
    type: 'shape',
  };
}

export function createPage(id: Id, width: number, height: number, init: Partial<Omit<Page, 'id'>> = {}): Page {
  return {
    width,
    height,
    background: { color: '#ffffff', imageAssetId: null, imageOpacity: 1 },
    layers: [],
    duration: null,
    ...init,
    id,
  };
}

export function createDocument(
  id: Id,
  firstPage: Page,
  now: number,
  init: Partial<Pick<DesignDocument, 'name' | 'dpi' | 'meta' | 'assets'>> = {},
): DesignDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name: init.name ?? 'Thiết kế mới',
    createdAt: now,
    updatedAt: now,
    dpi: init.dpi ?? 300,
    pages: [firstPage],
    assets: init.assets ?? {},
    meta: init.meta ?? { kind: null, locale: 'vi', templateId: null },
  };
}
