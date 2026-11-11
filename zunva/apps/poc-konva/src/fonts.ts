export const SANS = 'Be Vietnam Pro';
export const SERIF = 'Playfair Display';

// Sample with Vietnamese stacked diacritics so the browser fetches the Vietnamese subset.
const SAMPLE = 'Tiếng Việt ẮẰẲẴẶ ỄỆỘỢ ưở';

/** Resolves when both families (regular + bold) are ready, so Konva never draws with a fallback font. */
export async function loadFonts(): Promise<void> {
  const faces = [`400 32px "${SANS}"`, `700 32px "${SANS}"`, `400 32px "${SERIF}"`, `700 32px "${SERIF}"`];
  await Promise.all(faces.map((face) => document.fonts.load(face, SAMPLE)));
  await document.fonts.ready;
  const missing = faces.filter((face) => !document.fonts.check(face, SAMPLE));
  if (missing.length) throw new Error('Không tải được phông: ' + missing.join(', '));
}
