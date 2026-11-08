# Design — P0: Repository Audit

## Approach
Read-only inspection. Output is a single file: `docs/AUDIT_REPORT.md` (the only file that may be created).

## Steps
1. `git status`, `git branch -a`, `git log --oneline -20`; tree of the repo (skip node_modules, build output).
2. Read manifest/build files (package.json, config, Android project if any) to identify stack and entry points.
3. Trace each feature from UI tab to its handler; record file paths.
4. Search for secrets/keys: patterns like `AIza`, `sk-`, `api_key`, `apiKey`, localStorage writes of keys.
5. Search i18n: `vault_i18n.js` and every translation mechanism; list inconsistencies.
6. Try install/build/test commands; record exact output (success or error).
7. Write the report with sections: State, Stack, Run/Build/Test, Feature table, Defects & Risks, Gaps vs blueprint, Proposed tasks.

## Report format
- Feature table columns: Feature | Files | Status | Evidence | Notes.
- Proposed tasks: ID | Goal | Visible result | Acceptance criteria | Risk | Credit estimate.

## Out of scope
Any code change, refactor, renaming to ZUNVA, dependency upgrade, deployment.

## Open decisions (decide AFTER this audit)
Frontend/backend technology, release form, first cloud-backup provider, rename timing.
