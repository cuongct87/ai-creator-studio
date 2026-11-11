# ZUNVA Open Council — experimental engine (NOT RELEASED)

Independent implementation; **no OpenMausBot source or enterprise code copied**. This is an isolated pilot within the existing repo, not yet the planned standalone repository. See Issue #19, Issue #16, PR #17 for related work.

## What works
Python standard-library SQLite task queue, two role adapters A/B, independent answers followed by real cross-review prompts (each receives the other's answer), persisted evidence, redacted failure errors and three offline unit tests. **Tests use fake adapters, not real AI.** No provider API integration has been verified. Single worker only; running tasks remain stuck after process crash. No UI, retries, auth, quotas, cancellation, rate limiting or production hardening.

## Local offline tests
```sh
cd open-council
python -m unittest -v
```
To try a LIVE run you must supply your own explicitly authorized HTTPS endpoints that accept JSON `{"prompt":"...","role":"A"}` and respond `{"answer":"..."}`, plus tokens. This is a **custom adapter contract**, not a native Claude/Gemini/OpenAI API. Configure `COUNCIL_A_URL`, `COUNCIL_B_URL`, `COUNCIL_A_TOKEN`, `COUNCIL_B_TOKEN` locally (never commit them). Then use `python council.py submit "Review this design"`, `python council.py run-one`, `python council.py report <id>`. Live calls can incur provider costs; **do not enable without approval and quota controls**.

## Security / licensing
No shell execution, no arbitrary user-supplied endpoints, no keys in evidence by design; **agent answers may contain sensitive information**, so keep SQLite private. The adapter does not verify host allowlists, TLS pinning or per-provider pricing. Do not expose as a public server. The code in this folder is independently authored and intended under Apache-2.0 subject to repository licensing review; no OpenMausBot branding, code or enterprise directory is included. See [upstream licensing](https://github.com/milind-soni/OpenMausBot/blob/main/LICENSING.md).

## Next milestones
Provider-specific official adapters; explicit per-task token/cost limits; durable lease/retry and bounded concurrency; web/mobile report; secret store; standalone repo with full LICENSE/NOTICE/CONTRIBUTING/SECURITY; integration and security tests; actual two-provider evidence. No merge/release before founder review.
