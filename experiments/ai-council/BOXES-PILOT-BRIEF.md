# ZUNVA x Boxes.dev: pilot brief and founder checklist

Builds on `BOXES-NATIVE-COUNCIL.md` (PR #17) and Issue #16. Nothing here is LIVE until a real Boxes project and thread records exist.

## Founder checklist (only these steps need a human)

1. In Boxes.dev (web or phone), create a project from GitHub repo `cuongct87/ai-creator-studio`, branch `feature/zunva-boxes-pilot-brief-20261110`.
2. Review the upload/file list shown by Boxes. Confirm it does NOT include: `.env*`, `*.jks`, `*.keystore`, `local.properties`, `*.json` files holding keys, personal exports.
3. Turn auto-reload / auto-buy OFF. Note the box-hours shown. Approve (or refuse) the cost.
4. Sign in to Codex and to Claude Code through the official Boxes flow. Never paste login codes or keys into GitHub or chat logs.
5. Tell the coordinator "go" for ONE pilot (max 2 threads). Review the Vietnamese report on your phone.

## Pilot brief (non-sensitive, read-only; copy to the two prompt files)

Task: review the ZUNVA studio PNG export (`studio_v15.js`, function behind `#z-export`, and `AndroidImageSaver` in `MainActivity.java`).
Return, independently and in Vietnamese for a non-programmer owner:
1. What is confirmed from the code (cite file and line) and what is only a hypothesis.
2. The top 3 risks for exporting large canvases (up to 3000 px) on mid-range Android phones.
3. One small, testable improvement, with how to test it on a real phone.
Rules: read-only; do not edit files, open PRs, merge or deploy; do not call paid external services; no secrets in output.

## Stop conditions

Stop and report if: billing is uncertain, a thread asks for a secret, a worker tries to edit files, or more than 2 threads would start.

## Evidence

Use `boxes-meeting-report.mjs` with real thread IDs only. Do not mark anything LIVE without a Boxes thread/turn record.
