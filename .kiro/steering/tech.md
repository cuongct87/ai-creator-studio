
# AI Creator Studio v1.5 — Technical Architecture

## Technology Stack
- Android native application built with Java and Gradle.
- Android WebView for displaying the frontend.
- HTML5, CSS3, and vanilla JavaScript.
- Local browser storage for supported user data.
- External AI services may require user-provided API credentials.

## Project Structure

- app/src/main/assets/index.html — Main user interface.
- app/src/main/assets/style.css — Visual design and responsive styling.
- app/src/main/assets/script.js — Frontend application logic.
- app/src/main/assets/studio_v15.js — Additional Studio functionality.
- app/src/main/assets/vault_i18n.js — Localization support.
- app/src/main/java/ — Android Java source code.
- app/src/main/AndroidManifest.xml — Android app configuration.
- app/build.gradle — Android module configuration.

## Current Architecture
The Android application loads the local HTML frontend through WebView.

JavaScript manages the creative tools, user interactions, navigation, and localization.

The Android layer provides native capabilities, including integration for saving images to the device gallery.

## Localization
- The v1.5 interface supports 10 languages.
- Localization is implemented with JavaScript dictionaries.
- Maintain translation coverage across all supported languages.
- Preserve UTF-8 encoding and avoid breaking special characters.
- Check mobile layouts when translated labels become longer.

## Development Rules
1. Back up all working files before making changes.
2. Never replace entire working files without reviewing differences.
3. Modify only the files required for the task.
4. Preserve existing navigation and localization behavior.
5. Avoid duplicate JavaScript event handlers.
6. Check JavaScript syntax after relevant changes.
7. Do not expose API keys, credentials, or private data.
8. Test Android WebView behavior after frontend changes.
9. Keep unused experimental scripts out of the active application.
10. Report what has actually been tested.

## Known Limitations
- Full end-to-end testing remains incomplete.
- The current application is primarily Android/WebView based.
- Cross-platform desktop and iOS builds are future work.
- Advanced AI generation depends on available integrations.
- Community, marketplace, and online courses are not yet implemented.

## Future Architecture Goals
- Reusable frontend components.
- Improved responsive UI with light, dark, and system themes.
- Multilingual prompt interpretation.
- A visual template editor.
- AI-assisted animation and storytelling.
- Optional backend services for accounts and creator content.
- Evaluation of cross-platform frameworks before migration.

## Kiro Development Context
Kiro IDE has assisted with frontend development, debugging, localization, and release preparation.

These steering notes document the project as it currently exists and guide subsequent work. They do not retroactively represent earlier Kiro specifications.
