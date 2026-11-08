# CODE_MAP — P3 Canva-style UX, Task 0 (read-only audit)

Date: 2026-11-08 · Branch: `feature/zunva-first-studio-mvp` (PR #7, OPEN, "ZUNVA Studio UX 2.1 TEST") · HEAD `1aacf8e`
Scope: map only. No code changed. Line numbers are approximate (index.html is mostly one line).

## 1. Files and load order
- Web files live at the **repo root**: `index.html`, `script.js`, `studio_v15.js`, `style.css`, `vault_i18n.js`.
- `index.html` loads: `style.css?v=150` → `script.js?v=140` → `studio_v15.js?v=150` → an **inline `<script>`** (AI Pro / Image Toolkit Pro i18n, 10 languages) → `vault_i18n.js?v=151`.
- `script_phase2.js` and backup folders are **not** present / not loaded.

## 2. Panels and entry points
| Panel | Where defined | Default | Content |
|---|---|---|---|
| `#zunva` (ZUNVA Studio) | injected by `studio_v15.js` `ready()` (~line 361) | shown on load (`viewTab()` at end of `ready()`) | `#z-home` + `#z-editor` |
| `#prompt` | index.html | hidden after load | Prompt Studio (script.js) |
| `#video` | index.html | hidden | Video Storyboard (script.js) |
| `#image` | index.html | hidden | Image Toolkit + Pro print options, AndroidImageSaver download |
| `#ai` | index.html | hidden | Multi-AI / Gemini BYOK, AI Image Studio; `#v15Workspace` (Prompt Vault) injected by studio_v15.js lines 1–290 |

Top nav (`main > nav`, not a bottom bar): `navZunva` (inserted first), `navPrompt`, `navVideo`, `navImage`, `navAi`. On ≤720px it is a 3-column grid.

## 3. Tab router (two exist)
- **Router A** — `script.js` ~line 17: every `[data-tab]` button bound at load; toggles `hidden` on **all `main section`** (including nested ones). Bound before `navZunva` exists, so it only handles the 4 legacy tabs.
- **Router B** — `viewTab()` in `studio_v15.js` ~466: only for `navZunva`; toggles `hidden` on **direct children** of `main`. Also called by `openEditor()`.
- ⚠ Suspected bug (logic reading, not browser-verified): Router A also hides nested `section.z-recent` and `section.z-start` inside `#zunva`; Router B never un-hides them. So after visiting a legacy tab and returning to ZUNVA, "Continue designing" and "Start" may stay hidden. The CI smoke test does not check visibility after returning.
- design.md says "extend the existing router, do not create a second one" — Task 1 should merge A and B into one `showTab(name)`.

## 4. Home screen (`#z-home`, static innerHTML in `ready()`)
Top→bottom: hero (brand, headline, `#z-new` Start designing, `#z-jump` Explore templates, 3 pills) → search `#z-template-search` → "Continue designing" `#z-project-list` (grid of cards, `renderSaved()`) → "Choose how to start" 4 cards: `#z-start-blank`, `#z-start-template` (scroll), `#z-start-print` (filter Weddings), `#z-start-ai` (clicks `navAi`) → category chips `#z-filters` + grid `#z-gallery` → privacy note.
Not present: idea box that prefills AI, size-preset tiles, floating "+", quick-tools row, horizontal rows. No promo banner (good).

## 5. Editor (`#z-editor`)
- Entry: `openEditor(doc, id)`; sources `blank()` (1080×1350), `fromTemplate(t)` (deep copy, new layer ids), saved project, JSON import. No AI entry.
- One `<canvas id="z-canvas">`, 2D drawing (`draw()`); background = 2-colour gradient + decorative arcs; font Arial only.
- Layers: text `{id,text,x,y,size,color,weight}`, image `{id,type:'image',name,src,x,y,w,aspect}` (x/y/w are 0..1 fractions). No shapes.
- Works (CI smoke test covers it): pointer drag, add text, add photo (JPG/PNG/WebP ≤8 MB, resized ≤1400px), edit text/size/colour, layer list with ↑ ↓ ×, undo/redo (30 steps), canvas size + DPI → cm print size, save, auto-save on Back, export PNG (`AndroidImageSaver.saveImage` or `<a download>`), export/import JSON.
- Layout: heading row (`#z-back`, title) + toolbar (`#z-add`, `#z-add-image`, `#z-undo`, `#z-redo`, `#z-export`) + side panel. `controls()` already swaps text tools ↔ image tools by selection, but it is a side panel, not a bottom contextual toolbar.

## 6. Saved-project format
- `localStorage['zunva_studio_projects_v1']` = JSON array, newest first, **max 12** (`writeSaved` slices; oldest dropped silently).
- Item: `{ id: 'project-<ms>-<rand>', saved: ISO date, design: {version:1, name, width, height, dpi, bg:[hex,hex], layers:[...]}, preview: 'data:image/jpeg…' 120×150 }`.
- Functions: `readSaved`, `writeSaved`, `previewCanvas`, `persistProject(automatic)`, `renderSaved`.
- Risk: photos are stored as data URLs inside projects (≤2.8 M chars each) → localStorage quota (~5 MB) can fill fast; save shows a "storage full" notice.
- Other keys: `acs-lang` (language), `acs-v15-prompt-vault` (Prompt Vault, max 30). Gemini key: read from `#aiKey` input only; no storage write found.

## 7. i18n
- `script.js`: 10 languages, array dictionary + `ids` list; default = saved `acs-lang` → browser language → `en` (**not Vietnamese by default**).
- Inline script in index.html: AI Pro/Pro tools, 10 languages. `vault_i18n.js`: Prompt Vault, 10 languages.
- ZUNVA Studio: `studioStrings` map Vietnamese → [English, Spanish]; `studioText()`; other 7 languages fall back to English.

## 8. How web files reach Android assets
- `android/app/build.gradle`: task `syncWebAssets` copies the 5 root files to `build/generated/webAssets`; added to `assets.srcDirs`; `preBuild` depends on it. No committed assets folder.
- `MainActivity.java`: serves `https://appassets.androidplatform.net/assets/<name>` via `shouldInterceptRequest`, **whitelist of exactly 5 files**; anything else → 404. `AndroidImageSaver` JS bridge (MediaStore, Android 10+). `setAllowFileAccess(false)`.
- CI `.github/workflows/android-debug-apk.yml`: `node --check`, headless-Chrome smoke test of the ZUNVA journey, screenshots, `assembleDebug`, asserts the APK contains exactly the 5 assets byte-identical to root. Debug app id `vn.iaysystem.aicreatorstudio.p2lang`, versionName `2.1.0-localized-preview-test`.

## 9. Requirements vs current state
| Req | Status | Notes |
|---|---|---|
| R1 bottom nav 5 tabs | ❌ Missing | Top nav with 5 tool tabs; no Templates/Projects/Account tabs |
| R2.1 Home layout | 🟡 Partial | Has recent projects, start cards, templates; missing idea box, preset tiles (Wedding/Poster/Signage/Social/Video/Blank), horizontal rows, "+" button, quick tools |
| R2.2 tile → editor with preset size | ❌ Missing | Only Blank 1080×1350; no presets (A4, 1080×1080, 9:16, signage cm) |
| R2.3 idea box → AI tab prefilled, no paid call | ❌ Missing | `#z-start-ai` opens AI Pro without text; `#aiIdea` exists as the target |
| R3.1 Templates tab + chips | 🟡 Partial | Chips + grid + search exist on Home; not a separate tab; categories differ (no Signage/Obituary chip name) |
| R3.2 template → editable copy | ✅ Done | `fromTemplate()` deep copy; covered by CI smoke |
| R4.1 Projects tab list | 🟡 Partial | List with thumbnail/name/date on Home; not a tab |
| R4.2 reopen with layers intact | ✅ Done (CI) | Save/reopen incl. photo layer tested in headless Chrome; not yet re-tested on real phone after app restart |
| R5.1 one editor for blank/template/AI | 🟡 Partial | Blank + template + saved + JSON share `openEditor`; AI entry missing |
| R5.2 drag, multi-text, undo/redo, save, PNG | ✅ Done (CI) | PNG via canvas; real-device gallery save not re-verified here |
| R5.3 contextual bottom toolbar | 🟡 Partial | Selection swaps side-panel tools; no bottom toolbar; no shape/background tools |
| R6.1 old tools preserved | ✅ Usable | All 4 legacy panels + Vault + BYOK + AndroidImageSaver present; not yet moved under AI tab |
| R6.2 no API key stored | ✅ Done (static check) | No key patterns in code; key not written to storage; JSON export contains design only |
| R7 VI default + EN for new labels | 🟡 Partial | VI/EN/ES for Studio strings exist; default language is browser/`en`, not VI |

## 10. Open points for founder
1. Tab order conflict: requirements say Home, Templates, Projects, AI, Account; design.md says Home, Projects, Templates, AI, Account.
2. Start tiles conflict: R2 lists 6; design.md lists 8 (adds Obituary, Sales post, Invitation).
3. Task 0 also says "create branch `feat/canva-style-ux` and commit clean state" — not done (this session was read-only). Untracked items in the working tree: `.codex/`, `.kiro/specs/`, `.kiro/steering/zunva-rules.md`, `tools/`, `android/.gradle/`, `android/app/build/`, `android/build/`, and a stray file `ntent .androidappbuild.gradleGet-Content .androidappbuild.gradle` (looks like an accidental PowerShell output file).
4. Suspected router bug in §3 should be confirmed in a browser before Task 1.

## 11. `node tools/check.js .` output
```
1) Files exist            OK index.html, script.js, studio_v15.js, style.css, vault_i18n.js
2) JavaScript syntax      OK script.js, studio_v15.js, vault_i18n.js
3) Possible secrets       OK no key patterns found
4) HTML ids               WARN ids not found in HTML or JS templates: v15Workspace, zunva
5) Android whitelist      OK all referenced files allowed (index.html, script.js, studio_v15.js, style.css, vault_i18n.js)
6) Basic tab wiring       OK prompt, video, image, ai
Result: 0 FAIL, 1 WARN
```
The WARN is a false positive: both ids are set in JS via `element.id = '...'`, which the checker's regex does not detect.
