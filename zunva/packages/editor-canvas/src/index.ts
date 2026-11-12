/**
 * @zunva/editor-canvas — draws a DesignDocument page with Konva and reports changes as core Ops.
 * Contract: .kiro/specs/g2-trang-chu-chinh-sua/design.md.
 */
export { DesignCanvas } from './DesignCanvas';
export type { BrushSettings, DesignCanvasHandle, DesignCanvasProps } from './DesignCanvas';
export { MAX_MASK_SIDE, blendToComposite, maskCanvasSize } from './mask';
export { FONT_DETAILS, FONT_FAMILIES, VIETNAMESE_SAMPLE, fontsReady } from './fonts';
export type { FontInfo } from './fonts';
export { dragMergeKey, fitPage, patchFromTransform, transformMergeKey } from './geometry';
