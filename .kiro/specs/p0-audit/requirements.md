# Requirements — P0: Repository Audit (read-only)

## Introduction
Inventory the existing AI Creator Studio v1.5 Beta repository and lock requirements before any coding. No file may be modified in this spec except the report file.

## Requirements

### R1 — Repository state
**User story:** As the founder, I want to know the exact state of the repo, so that I can trust what exists.
1. WHEN the audit starts THEN the system SHALL report current branch, git status (clean/dirty), last commits and top-level structure.
2. IF the working tree is dirty THEN the system SHALL stop and ask before any checkpoint.

### R2 — Feature inventory
1. THE system SHALL list each feature (Prompt Studio, Image Toolkit, Video Storyboard, AI Pro, Print Studio Pro, Prompt Vault/Work Templates, Gemini BYOK, local save/export, tabs, i18n) with code evidence (file paths).
2. THE system SHALL mark each feature as: Verified working / Present but untested / Broken / Missing. A feature SHALL NOT be marked working without a test or run.

### R3 — Build and run
1. THE system SHALL document how to install, run, build and test the project, and the dependencies used.

### R4 — Defects and risks
1. THE system SHALL report defects and risks, especially: navigation, localization (`vault_i18n.js`, resource-blocking issue, inconsistent translation systems), Prompt Vault, Gemini BYOK, image editing, video/storyboard, AndroidImageSaver, local storage.
2. THE system SHALL check that no API key is hardcoded, logged or committed.

### R5 — Gap analysis
1. THE system SHALL compare the repo to ZUNVA_MASTER_PROJECT_BLUEPRINT sections 3–5 and list gaps.

### R6 — Task proposal
1. THE system SHALL propose a prioritized list of small, safe tasks, each with acceptance criteria and a rough credit-cost estimate.
2. THE system SHALL wait for founder approval before any coding.
