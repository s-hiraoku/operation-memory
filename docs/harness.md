---
layout: default
title: Codex Harness
---

# Codex Harness

Operation Memory includes a small Codex harness adapted from
[`s-hiraoku/codex-harnesses`](https://github.com/s-hiraoku/codex-harnesses). The harness keeps long-running work reviewable without changing the CLI runtime.

## Included Files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Durable repository guidance for Codex work. |
| `scripts/verify.sh` | Runs the repository verification loop: typecheck, tests, build, and smoke. |
| `scripts/smoke.sh` | Runs the built CLI through the MVP recipe-store flow in a temporary directory. |
| `scripts/checkpoint.sh` | Appends resumable task state to `ledger/current.md`. |
| `ledger/current.md` | Active task notes and checkpoints. |
| `ledger/decisions.md` | Durable implementation decisions. |
| `ledger/risks.md` | Known risks and mitigations. |
| `ledger/verification.md` | Verification commands and outcomes. |
| `policies/default.yaml` | Expected sandbox, approval, guard, and verification posture. |

## Daily Workflow

Start a task by reading `AGENTS.md`, checking the working tree, and inspecting the relevant source, tests, and docs. For longer tasks, run:

```sh
npm run checkpoint
```

Before finalizing a change, run:

```sh
npm run verify
```

The verification script runs typecheck, tests, build, and the smoke check. The GitHub Actions Verify workflow runs the same verification script on pull requests and pushes to `main`.

## Boundaries

The harness is project guidance and verification scaffolding. It does not add runtime execution, shell automation, browser automation, MCP server behavior, embeddings, or automatic log collection to Operation Memory.

Keep future harness additions small and explicit. Add only the skills, hooks, or policies that match repeated work in this repository.
