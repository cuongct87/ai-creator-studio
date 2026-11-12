import type { DesignDocument, Id, ImageLayer, Page } from '@zunva/core';
import type Konva from 'konva';
import { type JSX, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Layer as KLayer, Stage } from 'react-konva';
import { alphaMaskFromImage, createCanvas, encodeCanvas, renderComposite } from './composite';
import {
  encoderQuality,
  EXPORT_TIMEOUT_MS,
  type ExportMimeType,
  exportPictureBox,
  exportSize,
  exportUnderlay,
  pageAssetIds,
  withTimeout,
} from './exportImage';
import { fontsReady } from './fonts';
import type { SourceCrop } from './geometry';
import { fitCanvasSize, MAX_COMPOSITE_SIDE, maskCanvasSize, needsComposite } from './mask';
import { PageScene } from './PageScene';

export interface RenderPageOptions {
  /** Output = page size × pixelRatio (page pixels at 1). */
  pixelRatio: number;
  mimeType: ExportMimeType;
  /** JPG only, 0..1 (default 0.92). */
  quality?: number;
  /** blob:/data: URL of an asset (same as DesignCanvas). */
  assetUrl(id: Id): string | undefined;
}

const TIMEOUT_MESSAGE = 'Hết thời gian chờ tải phông chữ và ảnh (20 giây). Hãy thử lại.';

/** Loads one image; resolves null when it fails (drawn as the grey placeholder, like the screen). */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: ExportMimeType, quality: number | undefined): Promise<Blob> {
  // Không dùng canvas.toBlob: WebView chờ máy rảnh mới mã hóa (vài giây khi app đang bận).
  return encodeCanvas(canvas, mimeType, quality).catch(() => {
    throw new Error('Không xuất được ảnh trang.');
  });
}

/** Free the canvas memory right away (phones run out quickly with large pages). */
function release(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

/** Calls onReady once the Konva tree above it has been committed. */
function ReadySignal(props: { onReady(): void }): null {
  const { onReady } = props;
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

interface ExportSceneProps {
  page: Page;
  image(assetId: Id): HTMLImageElement | null;
  picture(layer: ImageLayer, image: HTMLImageElement, crop: SourceCrop | null): HTMLCanvasElement | null | undefined;
  underlay: string | null;
  onReady(layer: Konva.Layer | null): void;
}

function ExportScene(props: ExportSceneProps): JSX.Element {
  const { page, image, picture, underlay, onReady } = props;
  const layerRef = useRef<Konva.Layer>(null);
  const ready = useRef(() => onReady(layerRef.current));
  return (
    <Stage width={page.width} height={page.height} listening={false}>
      <KLayer ref={layerRef} listening={false}>
        <PageScene page={page} image={image} picture={picture} bind={() => ({ listening: false })} underlay={underlay} />
        <ReadySignal onReady={ready.current} />
      </KLayer>
    </Stage>
  );
}

/**
 * Draws one page of a document to an image, without the editor on screen. Uses the same scene
 * code as DesignCanvas (PageScene), so the result matches the screen; no handles, frames or ↻.
 * Waits for fonts and every image / mask of the page (20 s limit).
 */
export async function renderPageImage(doc: DesignDocument, pageId: Id, opts: RenderPageOptions): Promise<Blob> {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) throw new Error('Không tìm thấy trang cần xuất.');
  const size = exportSize(page, opts.pixelRatio);
  const pixelRatio = opts.pixelRatio;

  // 1. Fonts and pictures.
  const loaded = new Map<Id, HTMLImageElement | null>();
  await withTimeout(
    Promise.all([
      fontsReady(),
      ...pageAssetIds(page).map(async (id) => {
        const url = opts.assetUrl(id);
        loaded.set(id, url ? await loadImage(url) : null);
      }),
    ]),
    EXPORT_TIMEOUT_MS,
    TIMEOUT_MESSAGE,
  );

  // 2. Offscreen pictures of masked / feathered images, at export resolution (≤ 2048 px).
  const pictures: HTMLCanvasElement[] = [];
  const pictureByLayer = new Map<Id, HTMLCanvasElement | null>();
  const picture = (layer: ImageLayer, img: HTMLImageElement, crop: SourceCrop | null): HTMLCanvasElement | null | undefined => {
    if (!needsComposite(layer)) return undefined;
    const known = pictureByLayer.get(layer.id);
    if (known !== undefined) return known;
    let result: HTMLCanvasElement | null = null;
    const maskImage = layer.maskAssetId ? (loaded.get(layer.maskAssetId) ?? null) : null;
    // A mask that could not be loaded: grey placeholder, never the un-erased image.
    if (!layer.maskAssetId || maskImage) {
      const mask = maskImage ? alphaMaskFromImage(maskImage, maskCanvasSize(layer)) : null;
      result = renderComposite({ layer, image: img, crop, mask }, fitCanvasSize(exportPictureBox(layer, pixelRatio), MAX_COMPOSITE_SIDE));
      pictures.push(result);
      if (mask) release(mask);
    }
    pictureByLayer.set(layer.id, result);
    return result;
  };
  const image = (id: Id) => loaded.get(id) ?? null;

  // 3. Hidden stage (never attached to the page), same scene code as the screen.
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    const layer = await withTimeout(
      new Promise<Konva.Layer | null>((resolve) => {
        root.render(
          <ExportScene page={page} image={image} picture={picture} underlay={exportUnderlay(opts.mimeType, page.background.color)} onReady={resolve} />,
        );
      }),
      EXPORT_TIMEOUT_MS,
      TIMEOUT_MESSAGE,
    );
    if (!layer) throw new Error('Không dựng được trang để xuất ảnh.');

    const drawn = layer.toCanvas({ x: 0, y: 0, width: page.width, height: page.height, pixelRatio });
    const out = createCanvas(size);
    try {
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Trình duyệt không vẽ được canvas 2D.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(drawn, 0, 0, size.width, size.height);
      return await canvasToBlob(out, opts.mimeType, encoderQuality(opts.mimeType, opts.quality));
    } finally {
      release(drawn);
      release(out);
    }
  } finally {
    root.unmount();
    for (const c of pictures) release(c);
  }
}
