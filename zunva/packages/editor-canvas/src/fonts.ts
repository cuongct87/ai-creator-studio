/**
 * Vietnamese-capable fonts bundled with the app (SIL Open Font License 1.1, via @fontsource 5.3.0).
 * Only the "latin" and "vietnamese" subsets are imported, so no network is needed and the bundle
 * stays small. All six fonts were checked on api.fontsource.org to have a "vietnamese" subset.
 */

import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/latin-400-italic.css';
import '@fontsource/be-vietnam-pro/vietnamese-400-italic.css';
import '@fontsource/be-vietnam-pro/latin-700-italic.css';
import '@fontsource/be-vietnam-pro/vietnamese-700-italic.css';

import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/vietnamese-400.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/playfair-display/vietnamese-700.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/playfair-display/vietnamese-400-italic.css';
import '@fontsource/playfair-display/latin-700-italic.css';
import '@fontsource/playfair-display/vietnamese-700-italic.css';

import '@fontsource/dancing-script/latin-400.css';
import '@fontsource/dancing-script/vietnamese-400.css';
import '@fontsource/dancing-script/latin-700.css';
import '@fontsource/dancing-script/vietnamese-700.css';

import '@fontsource/lora/latin-400.css';
import '@fontsource/lora/vietnamese-400.css';
import '@fontsource/lora/latin-700.css';
import '@fontsource/lora/vietnamese-700.css';
import '@fontsource/lora/latin-400-italic.css';
import '@fontsource/lora/vietnamese-400-italic.css';
import '@fontsource/lora/latin-700-italic.css';
import '@fontsource/lora/vietnamese-700-italic.css';

import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/vietnamese-400.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/vietnamese-700.css';
import '@fontsource/montserrat/latin-400-italic.css';
import '@fontsource/montserrat/vietnamese-400-italic.css';
import '@fontsource/montserrat/latin-700-italic.css';
import '@fontsource/montserrat/vietnamese-700-italic.css';

import '@fontsource/pacifico/latin-400.css';
import '@fontsource/pacifico/vietnamese-400.css';

export interface FontInfo {
  /** CSS family name; this is the value stored in TextLayer.fontFamily. */
  id: string;
  /** Name shown to the user. */
  label: string;
  /** Weights bundled (other weights are drawn with the nearest one). */
  weights: readonly number[];
  /** True if a real italic face is bundled (otherwise the browser slants the font). */
  italic: boolean;
  category: 'sans-serif' | 'serif' | 'handwriting';
}

export const FONT_DETAILS: readonly FontInfo[] = [
  { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro', weights: [400, 700], italic: true, category: 'sans-serif' },
  { id: 'Playfair Display', label: 'Playfair Display', weights: [400, 700], italic: true, category: 'serif' },
  { id: 'Dancing Script', label: 'Dancing Script', weights: [400, 700], italic: false, category: 'handwriting' },
  { id: 'Lora', label: 'Lora', weights: [400, 700], italic: true, category: 'serif' },
  { id: 'Montserrat', label: 'Montserrat', weights: [400, 700], italic: true, category: 'sans-serif' },
  { id: 'Pacifico', label: 'Pacifico', weights: [400], italic: false, category: 'handwriting' },
];

/** Font list for the font picker (contract in design.md). */
export const FONT_FAMILIES: readonly { id: string; label: string }[] = FONT_DETAILS.map(({ id, label }) => ({ id, label }));

/** Text with stacked Vietnamese marks, so the browser downloads the Vietnamese subset. */
export const VIETNAMESE_SAMPLE = 'Trân trọng kính mời ẮẰẲẴẶ ỄỆỘỢ ưở đĐ';

let ready: Promise<void> | null = null;

/**
 * Resolves when every bundled face has been loaded (or has failed), so Konva measures text with
 * the real font instead of a fallback. Never rejects: a missing face must not block the editor.
 */
export function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  if (!ready) {
    const faces = FONT_DETAILS.flatMap((font) =>
      font.weights.flatMap((weight) => {
        const normal = `${weight} 32px "${font.id}"`;
        return font.italic ? [normal, `italic ${normal}`] : [normal];
      }),
    );
    ready = Promise.allSettled(faces.map((face) => document.fonts.load(face, VIETNAMESE_SAMPLE)))
      .then(() => document.fonts.ready)
      .then(() => undefined);
  }
  return ready;
}
