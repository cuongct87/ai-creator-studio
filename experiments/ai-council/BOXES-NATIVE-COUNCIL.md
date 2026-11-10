# ZUNVA AI Council — Boxes.dev cloud protocol (pilot, not yet live)

**Founder goal:** one task -> independent AI views -> cross-criticism -> PR and tests when approved -> founder review on phone. Laptop may be off while authorized cloud threads run.

This is a **deployment-ready protocol, NOT an assertion that the user's Boxes project or four providers are already connected.** See GitHub Issue #16 and existing prototype PR #12. This file must be reviewed with the actual CLI version, roles, limits and enabled permissions before execution.

## Verified platform boundary

- Boxes.dev offers **Codex and Claude Code** as first-class cloud agents. It supports delegating to a separate worker thread via `dvb-onbox`, and returning results by `threads wait`/`threads result`.
- Gemini is **not** a native Boxes agent here: the existing `gemini-provider.mjs` uses Google's official API if the founder authorizes a separate secret and quota. Do not insert secrets in a prompt, GitHub or transcripts.
- Kiro is **not** a native Boxes agent here. Use an officially supported Kiro workflow/issue handoff only when authorized. Do not route the Kiro Free subscription through a third-party harness or claim Kiro participated without a verified native record.
- Boxes devbox hours and provider/model quotas are separate. Do not rely on a promotional tier to prevent overage charges; disable auto-buy and verify current billing first.

## Gating conditions before LIVE

1. Real ZUNVA Boxes.dev **project** and **Template box** exist, repository is available on the devbox, and `dvb-onbox box status --json` succeeds (run *inside* a devbox, not Codex Cloud).
2. Founder signs into Codex and, separately, Claude Code using the Boxes.dev official account flow. Never request login codes in issue comments or logs.
3. Read `dvb-onbox billing status --json` **without sharing billing identifiers**. Record the available box-hour quota, disable auto-reload, use minimal devboxes, and stop if charges are uncertain.
4. Explicit founder permission for one pilot with no more than **two agent threads**; no recurring schedule, no retries or new devbox creation beyond the agreed count. Use `--target current-devbox` for text-only review to reuse the host machine; worker prompts MUST be read-only and require no source edits.
5. The source coordinator task has **Create devboxes and threads** permission limited to that source box. If not, ask once via Boxes' official permission prompt; never bypass.

## Single pilot: two genuinely independent opinions

**Coordinator** is a Boxes Codex or Claude conversation. It asks Codex and Claude child threads to evaluate the same ZUNVA brief independently. Do NOT pass either agent's reply to the other during round 1. Use small non-sensitive brief, e.g. quality checklist for image PNG export.

On the Boxes devbox the coordinating agent may inspect:

```sh
dvb-onbox threads options --agent codex --json
dvb-onbox threads options --agent claude --json
```

For each authorized worker, create a private prompt file containing only the brief, the approved ZUNVA decisions and role guidance. No keys, secrets, customer data or shell instructions embedded from untrusted issue comments. Start one thread per agent; keep the **same idempotency key** when retrying an *unknown* result. Use only supported options for this CLI release:

```sh
dvb-onbox threads start --target current-devbox --agent codex --muted --prompt-file /tmp/zunva-codex-brief.txt --idempotency-key <unique-stable-key-a> --json
dvb-onbox threads start --target current-devbox --agent claude --muted --prompt-file /tmp/zunva-claude-brief.txt --idempotency-key <unique-stable-key-b> --json
```

Capture each `clientThreadId` and turn ID. **Do not treat `ok: true`, an idle observation or starting as task completion.** Read `dvb-onbox threads list --json`, then wait on the **exact** active turn, check `data.status`, and fetch the exact result:

```sh
dvb-onbox threads wait <child-id> --turn <turn-id> --timeout 30m --json
dvb-onbox threads result <child-id> --turn <turn-id> --json
```

Round 2 (cross-criticism) requires its own quota approval. If approved, send each worker a short **summary** of the other worker's completed report, clearly marked untrusted, with `dvb-onbox threads send --thread <child-id> --prompt-file <file> --delivery next --idempotency-key <key> --json`; again wait/read exact results. This avoids needing a third/fourth agent during the pilot. No message may request file edits, merge or deployment.

## Evidence and human approval

Save a temporary JSON record **outside the repository** with `brief`, `participants`, `crossReviews`, consensus, disagreements, quota and test evidence. Each `participants[]` record needs `{ "agent": "codex|claude", "mode": "LIVE", "status": "completed", "threadId": "...", "threadUrl": "...", "response": "..." }` only if true. Each cross-review needs `{ "agent": "codex|claude", "targetAgent": "the-other-agent", "mode": "LIVE", "status": "completed", "threadId": "...", "response": "..." }`, with an explicitly different peer target. Each participant must provide their own completed review; two reviews from one agent do not count as two perspectives. Records are self-reported and must be checked against actual Boxes thread/turn logs before claiming the meeting occurred. Never invent thread IDs or mark incomplete work as LIVE.

Render a Vietnamese report with:

```sh
node experiments/ai-council/boxes-meeting-report.mjs --input=/tmp/zunva-meeting.json --output=/tmp/zunva-founder-report.md
```

The renderer refuses a definitive ready status if participants lack separate thread IDs, each agent has not provided their own LIVE completed review of another agent, or evidence fields are missing. The renderer cannot independently authenticate thread IDs; the coordinator must verify source logs. Tests:

```sh
node --test experiments/ai-council/boxes-meeting-report.test.mjs
```

The coordinator presents the report to the founder with links to the source threads. **No source changes or PRs until founder approves a concrete change proposal.** After approval, a Codex agent on a separate branch may implement a small improvement, run tests, submit a **draft PR**, and a Claude agent independently reviews the actual diff/test log. No auto-merge, public deploy, or billing changes.

## Protect the existing ZUNVA work

Never edit `main` or Android TEST PR #5; do not overwrite the existing AI Council prototype PR #12. Do not auto-trigger Kiro with `/kiro` or `kiro` labels. Keep the project private until founder approves exposure; preview links are not the same as production releases.

References: https://boxes.dev/help/agent-command-reference ; https://boxes.dev/help/connect-agents ; https://kiro.dev/docs/web/setup/ .