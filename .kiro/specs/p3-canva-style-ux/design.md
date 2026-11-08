# Design — P3: Canva-style UX

## Principles
- Organized by goal, not by tool. Every entry leads to the same editor.
- Mobile first: one screen per tab, large tap targets, bottom bar always visible except inside the editor.
- Minimal change: wrap and re-route existing panels (`#prompt`, `#video`, `#image`, `#ai`) instead of rewriting them.

## Screen map
| Tab | Content |
|---|---|
| Home | idea box, start tiles, template row, recent projects |
| Templates | category chips + grid, tap = editable copy |
| Projects | saved projects list, tap = reopen |
| AI | idea-to-design prompt, Prompt Studio, Storyboard, Gemini image (all existing panels) |
| Account | BYOK connection, language, backup/export-import |

## Home screen layout (top to bottom, mobile)
Reference: the Canva mobile home (layout idea only; do NOT copy its colors, icons, names or promo banners).
1. Header: ZUNVA logo + language selector (existing `#language`). No promo or trial banner.
2. Headline: "What do you want to create today?" (vi: "Bạn muốn sáng tạo gì hôm nay?") + one large idea box (placeholder "Describe your idea / Mô tả ý tưởng của bạn"). Submit opens the AI tab with the text prefilled; never calls a paid AI.
3. "Continue designing": horizontal row of recent project cards (thumbnail + name, max 12 from saved projects). If none: one empty card "Create your first design".
4. "Start here": two rows of round colored icons with labels — Wedding card, Obituary, Signage, Sales post, Invitation, Social post, Video, Blank. Each opens the editor with a preset size. Use ZUNVA's own palette and icons.
5. "Templates for you": horizontal row of template cards (the existing 5 templates), "See all" goes to the Templates tab.
6. Quick tools row: show ONLY tools that already work (e.g. Image Toolkit, Prompt Studio, Storyboard). Do not show placeholders for unbuilt features.
7. Floating "+" button bottom-right: opens a sheet with the same start options.
8. Bottom bar always visible: Home, Projects, Templates, AI, Account.
All cards share one size per row; rows scroll horizontally; tap targets at least 44px; Vietnamese labels must not truncate badly on 360px width.

## Editor layout
Canvas in the center; top bar: back, undo, redo, export; bottom toolbar: Text, Image, Shape, Layers, Background. Tapping an object replaces the bottom toolbar with that object's options (font, size, color, align, delete).

## Technical notes
- Keep vanilla JS. Add one small router function: `showTab(name)`; panels toggled via the existing `hidden` class.
- Reuse existing localStorage project format; if it must change, add a version field and keep reading the old format.
- Presets: Wedding card, Poster A4, Signage (cm input), Social post 1080×1080, Video 9:16, Blank.

## Constraints found in the real repo
- Android `MainActivity.java` only serves 5 files from assets: index.html, script.js, studio_v15.js, style.css, vault_i18n.js. Any NEW file (new .js, font, image) returns 404 unless the whitelist is updated. Prefer editing these 5 files; if a new file is needed, add it to the whitelist in the same task.
- Web files live at the repo root; the Android module has no assets folder committed. Before building, confirm how files are copied into `app/src/main/assets/`.
- The tab router already exists (`data-tab` buttons + `hidden` class, `viewTab()` in studio_v15.js). Extend it; do not create a second router.
- Saved projects currently use localStorage (`SAVED_KEY`, max 12). Keep reading this format.
- Gallery save (AndroidImageSaver) needs Android 10+.

## Out of scope
Community, marketplace, payments, timeline video editor, classes, renaming code to ZUNVA.
