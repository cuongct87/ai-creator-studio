# Requirements — P3: Canva-style UX (mobile-first)

## Introduction
Reorganize the app by user goal ("what do I want to make?") instead of by technical tool. Keep all existing features working. Keep the current stack (plain HTML/JS/CSS + Android WebView). Do NOT introduce a framework or rename files without approval.

## Requirements

### R1 — Bottom navigation (5 tabs)
1. THE app SHALL show a bottom bar: Home, Templates, Projects, AI, Account.
2. WHEN a tab is tapped THEN the system SHALL show only that tab's screen, with the active tab highlighted.

### R2 — Home screen
1. THE Home screen SHALL show, top to bottom: an idea box ("What do you want to create today?"), a "Start here" row of tiles (Wedding card, Poster, Signage, Social post, Video, Blank), a template row, and recent projects.
2. WHEN a tile is tapped THEN the system SHALL open the editor with the matching preset size.
3. WHEN the user submits text in the idea box THEN the system SHALL open the AI tab with that text prefilled. It SHALL NOT call any paid AI automatically.

### R3 — Templates tab
1. THE Templates tab SHALL list existing templates with category chips (e.g. Wedding, Obituary, Signage, Social).
2. WHEN a template is tapped THEN the system SHALL open it in the editor as an editable copy.

### R4 — Projects tab
1. THE Projects tab SHALL list saved projects (thumbnail, name, last edited).
2. WHEN a project is tapped THEN the editor SHALL reopen it with all text layers and positions intact.

### R5 — One editor
1. Blank, template and AI entry points SHALL all lead to the same editor.
2. THE editor SHALL keep drag, multi-text layers, undo/redo, save and PNG export working.
3. WHEN an object is selected THEN the system SHALL show only that object's options in a bottom toolbar.

### R6 — Existing tools preserved
1. Prompt Studio, Video Storyboard, Image Toolkit, AI Pro, Gemini BYOK and AndroidImageSaver SHALL remain usable, moved under the AI tab or the editor.
2. No API key SHALL be stored in code, logs or exports.

### R7 — Language
1. All new labels SHALL support Vietnamese (default) and English through the existing i18n mechanism.
