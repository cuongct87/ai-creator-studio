
# AI Creator Studio v1.5 — Project Structure

## Project Root
AI-Creator-Studio-Android-v1.5-Beta/

## Android Application
- app/src/main/ — Android application source.
- app/src/main/assets/ — WebView frontend files.
- app/src/main/java/ — Native Android Java code.
- app/src/main/AndroidManifest.xml — Android configuration.
- app/build.gradle — App build configuration.

## Active Frontend Files
- index.html — Main application interface.
- style.css — Responsive layout and styling.
- script.js — Main JavaScript functionality.
- studio_v15.js — Studio features.
- vault_i18n.js — Multilingual support.

All five files are located in app/src/main/assets/.

## Existing Backup and Experimental Files
- assets/backup_final_release/ — Previous release backup.
- assets/backup_phase2/ — Earlier development backup.
- assets/script_phase2.js — Experimental script retained from development.

Do not assume experimental scripts are active without inspecting index.html.

## Steering Documentation
- .kiro/steering/product.md — Product goals and current status.
- .kiro/steering/tech.md — Technical architecture and development rules.
- .kiro/steering/structure.md — Project file organization.

These steering documents were created after the initial development work to guide future Kiro sessions.

## Source Control Guidelines
- Keep production source files organized and documented.
- Do not upload API keys, passwords, local.properties, or private configuration.
- Exclude generated build outputs and local IDE caches.
- Review file differences before committing.
- Keep the project history and implementation claims accurate.

## Release Checklist
1. Preserve a verified backup.
2. Check that the four main sections navigate correctly.
3. Check localization and mobile layout.
4. Test core functionality on an Android device.
5. Update public GitHub source files.
6. Confirm the .kiro directory is included in the repository.
7. Provide an accessible working demo or test build.
8. Describe real Kiro usage in the hackathon submission.

## Future Development
ZUNVA is a proposed future brand name, subject to trademark clearance.

Marketplace, academy, community, AI animation generation, and expanded cross-platform support are planned ideas, not completed functionality.
