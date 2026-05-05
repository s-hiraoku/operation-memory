# Operation Memory Codex Harness

Keep changes minimal, reviewable, and directly tied to the active task.

## Project Shape

- This is a TypeScript/Node.js CLI for non-executing Operation Recipe management.
- Runtime behavior lives under `src/`.
- Full recipe examples live under `examples/recipes/` and `docs/examples/`.
- Design and safety documents live under `README.md`, `SPEC.md`, `SECURITY.md`, and `docs/`.

## Safety Rules

- Do not add runtime execution, Playwright, shell execution, MCP server behavior, embeddings, or automatic log collection unless explicitly requested.
- Preserve the non-executing semantics of recipes: `suggested_command` and `guidance` are descriptive only.
- Treat recipe examples as reviewable source files. Avoid secrets, personal data, raw DOM, screenshots, HAR files, browser storage, signed URLs, token-bearing URLs, and unabstracted internal hostnames.
- Do not use destructive git operations without explicit approval.

## Before Editing

- Check `git status --short --branch`.
- Inspect the relevant source, test, and docs files before deciding the change.
- For long-running work, update `ledger/current.md` or run `npm run checkpoint`.

## Before Finalizing

- Run `npm run verify` when practical.
- If the change is narrow, at minimum run the targeted check plus `npm run typecheck`.
- Summarize changed files, verification, and residual risks.
