# THIRD-PARTY NOTICES — ZUNVA AI Council pilot

## Source reference and design attribution

This standalone ZUNVA pilot uses its own implementation. Its architecture
and safe non-interactive CLI invocation pattern are adapted from the
open-source design/code patterns published by:

OpenMausBot — Copyright 2026 Milind Soni and OpenMausBot contributors.
Upstream: https://github.com/milind-soni/OpenMausBot
Open-source core: Apache License, Version 2.0.
License: https://www.apache.org/licenses/LICENSE-2.0
Upstream NOTICE: https://github.com/milind-soni/OpenMausBot/blob/main/NOTICE

Relevant upstream sources:
- server/drivers/codex-background-text.ts (isolated non-interactive CLI calls)
- server/harness/registry.ts (provider registry)
- docs/runtime-contract.md (assignment lifecycle and approval states)

This notice does not imply endorsement. No upstream trademarks, logos,
mascot, or source from enterprise/ are included. The enterprise/ directory
has a separate restrictive license; see:
https://github.com/milind-soni/OpenMausBot/blob/main/LICENSING.md

If actual source files from OpenMausBot or its third-party dependencies
are copied later, preserve their required copyright headers, license
texts and NOTICE attributions. Review any individual dependency license.
