import type { Id, ImageLayer, Layer, Page, ShapeLayer, TextLayer } from '@zunva/core';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { JSX } from 'react';
import { Ellipse, Group, Image as KImage, Line, Rect, Text } from 'react-konva';
import { coverCrop, cropToSource, konvaFontStyle, type SourceCrop } from './geometry';
import { blendToComposite } from './mask';

/**
 * Draws a page (background + layers) as Konva nodes. Shared by the editor (DesignCanvas) and the
 * export (renderPageImage), so the exported image is drawn by the same code as the screen.
 * Must be placed inside a react-konva <Layer>.
 */

export const PLACEHOLDER_FILL = '#d0d5dd';

type AnyHandler = (e: KonvaEventObject<Event>) => void;

/** Interactive props the editor adds to each layer node (the export adds none). */
export interface LayerBinding {
  ref?: (node: Konva.Node | null) => void;
  listening?: boolean;
  draggable?: boolean;
  onClick?: AnyHandler;
  onTap?: AnyHandler;
  onDragStart?: () => void;
  onDragMove?: () => void;
  onDragEnd?: () => void;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

/** Extra props for text nodes (editor: double tap opens the text box). */
export interface TextBinding {
  onDblClick?: () => void;
  onDblTap?: () => void;
}

const NO_BINDING: LayerBinding = {};
const NO_TEXT_BINDING: TextBinding = {};

export interface PageSceneProps {
  page: Page;
  /** Loaded image of an asset, or null (still loading / failed → grey placeholder). */
  image(assetId: Id): HTMLImageElement | null;
  /**
   * Offscreen picture of an image layer (mask, feather, eraser stroke).
   * undefined = draw the plain image; null = not ready → grey placeholder (never the un-erased image).
   */
  picture(layer: ImageLayer, image: HTMLImageElement, crop: SourceCrop | null): HTMLCanvasElement | null | undefined;
  bind?(layer: Layer): LayerBinding;
  bindText?(layer: TextLayer): TextBinding;
  /** Changes when fonts finish loading: text nodes remount so Konva re-measures. */
  textKey?: string | number;
  /** Thin grey page border (editor only, never exported). */
  border?: boolean;
  /** Colour painted under everything (JPG export: white). */
  underlay?: string | null;
}

export function PageScene(props: PageSceneProps): JSX.Element {
  const { page, image, picture, bind, bindText, textKey = 0, border = false, underlay = null } = props;

  const bound = (layer: Layer): LayerBinding => (bind ? bind(layer) : NO_BINDING);
  const boundText = (layer: TextLayer): TextBinding => (bindText ? bindText(layer) : NO_TEXT_BINDING);

  const base = (layer: Layer) => ({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    visible: !layer.hidden,
  });

  const drawText = (layer: TextLayer) => (
    <Text
      key={`${layer.id}:${textKey}`}
      {...base(layer)}
      {...bound(layer)}
      {...boundText(layer)}
      text={layer.text}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fontStyle={konvaFontStyle(layer)}
      fill={layer.color}
      globalCompositeOperation={blendToComposite(layer.blendMode)}
      width={layer.width}
      align={layer.align}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      wrap="word"
      perfectDrawEnabled={false}
    />
  );

  const drawShape = (layer: ShapeLayer) => {
    // A transparent fill keeps the inside tappable when the shape has no fill.
    const fill = layer.fill ?? 'rgba(0,0,0,0)';
    const blend = blendToComposite(layer.blendMode);
    const outline = layer.stroke && layer.strokeWidth > 0 ? { stroke: layer.stroke, strokeWidth: layer.strokeWidth } : { strokeEnabled: false };
    switch (layer.shape) {
      case 'rect':
        return (
          <Rect
            key={layer.id}
            {...base(layer)}
            {...bound(layer)}
            width={layer.width}
            height={layer.height}
            fill={fill}
            cornerRadius={layer.cornerRadius}
            {...outline}
            globalCompositeOperation={blend}
            perfectDrawEnabled={false}
          />
        );
      case 'ellipse':
        // Offset so (x, y) stays the top-left corner, like every other layer.
        return (
          <Ellipse
            key={layer.id}
            {...base(layer)}
            {...bound(layer)}
            radiusX={layer.width / 2}
            radiusY={layer.height / 2}
            offsetX={-layer.width / 2}
            offsetY={-layer.height / 2}
            fill={fill}
            {...outline}
            globalCompositeOperation={blend}
            perfectDrawEnabled={false}
          />
        );
      case 'line': {
        const width = layer.strokeWidth > 0 ? layer.strokeWidth : 4;
        return (
          <Line
            key={layer.id}
            {...base(layer)}
            {...bound(layer)}
            points={[0, layer.height / 2, layer.width, layer.height / 2]}
            stroke={layer.stroke ?? layer.fill ?? '#0d1422'}
            strokeWidth={width}
            hitStrokeWidth={Math.max(24, width)}
            globalCompositeOperation={blend}
            lineCap="round"
            perfectDrawEnabled={false}
          />
        );
      }
    }
  };

  const drawImage = (layer: ImageLayer) => {
    const img = image(layer.assetId);
    const crop = img ? cropToSource(layer.crop, { width: img.naturalWidth, height: img.naturalHeight }) : null;
    // Blend mode goes on the drawn child: Konva applies it per shape, not per group.
    const blend = blendToComposite(layer.blendMode);
    const pic = img ? picture(layer, img, crop) : null;
    const placeholder = (
      <Rect width={layer.width} height={layer.height} fill={PLACEHOLDER_FILL} cornerRadius={layer.cornerRadius} globalCompositeOperation={blend} perfectDrawEnabled={false} />
    );
    let content: JSX.Element;
    if (!img || pic === null) {
      content = placeholder;
    } else if (pic) {
      // Flip, mask, rounded corners and soft edge are already inside the offscreen picture.
      content = <KImage image={pic} width={layer.width} height={layer.height} globalCompositeOperation={blend} perfectDrawEnabled={false} />;
    } else {
      content = (
        <KImage
          image={img}
          width={layer.width}
          height={layer.height}
          cornerRadius={layer.cornerRadius}
          {...(crop ? { crop } : {})}
          x={layer.flipX ? layer.width : 0}
          y={layer.flipY ? layer.height : 0}
          scaleX={layer.flipX ? -1 : 1}
          scaleY={layer.flipY ? -1 : 1}
          globalCompositeOperation={blend}
          perfectDrawEnabled={false}
        />
      );
    }
    return (
      <Group key={layer.id} {...base(layer)} {...bound(layer)}>
        {content}
      </Group>
    );
  };

  const drawLayer = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return drawText(layer);
      case 'shape':
        return drawShape(layer);
      case 'image':
        return drawImage(layer);
    }
  };

  const bgImage = page.background.imageAssetId ? image(page.background.imageAssetId) : null;
  const borderProps = border ? { stroke: '#c9d1dc', strokeWidth: 1, strokeScaleEnabled: false } : { strokeEnabled: false };

  return (
    <>
      {underlay && <Rect width={page.width} height={page.height} fill={underlay} listening={false} perfectDrawEnabled={false} />}
      <Rect name="page-bg" width={page.width} height={page.height} fill={page.background.color} {...borderProps} perfectDrawEnabled={false} />
      {bgImage && (
        <KImage
          image={bgImage}
          width={page.width}
          height={page.height}
          crop={coverCrop({ width: bgImage.naturalWidth, height: bgImage.naturalHeight }, { width: page.width, height: page.height })}
          opacity={page.background.imageOpacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      <Group clipX={0} clipY={0} clipWidth={page.width} clipHeight={page.height}>
        {page.layers.map(drawLayer)}
      </Group>
    </>
  );
}
