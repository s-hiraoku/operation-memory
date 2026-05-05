# Operation Memory

Operation Memory is a local-first CLI for operational recipes: repeatable procedures, decision patterns, incident review steps, release handoffs, and recovery notes that need to remain searchable outside chat.

## Why This Exists

Chats are good for coordination, tickets are good for assignment, and docs are good for polished reference material. Operation Memory covers the layer between them: compact operational knowledge that agents and humans can validate, list, search, and reuse.

Compared with a wiki, Operation Memory favors structured recipes over long pages. Compared with a vector database, the MVP starts with auditable local YAML and deterministic search. Compared with an issue tracker, it does not own workflow state, priority, or assignment.

## What It Is Not

- RPA: RPA executes scripted workflows. Operation Memory stores the procedure and safety notes; this MVP does not execute the steps.
- Memory: ordinary agent memory remembers user or project context. Operation Memory remembers how to perform operations.
- RAG: RAG retrieves unstructured or semi-structured documents. Operation Memory retrieves validated recipes with typed fields and policy metadata.
- MCP: MCP gives tools an official AI-facing API. Operation Memory is useful when a web app, CLI, SaaS product, or cloud console has no MCP server yet.
- Skills: skills package agent capabilities and instructions. Operation Memory stores local operational experience that can be searched before using those capabilities.
- Observability: observability records what systems did. Operation Memory records what operators or agents should do, what can fail, and when to ask a human.

## Install

```sh
npm install
npm run build
```

Run during development:

```sh
node dist/cli.js --help
```

After package linking or installation:

```sh
opmem --help
```

## Usage

Initialize a local recipe store:

```sh
opmem init
```

Add a recipe:

```sh
opmem add examples/recipes/release-handoff.yml
```

List recipes:

```sh
opmem list
opmem list --json
```

Search recipes:

```sh
opmem search "rollback release"
opmem search "customer impact" --json
```

Show one recipe:

```sh
opmem show release-handoff
```

Validate recipe files, or validate the local store when no file is passed:

```sh
opmem validate examples/recipes/incident-review.yml examples/recipes/release-handoff.yml
opmem validate --json
```

## Commands

| Command | Purpose |
| --- | --- |
| `opmem init` | Create `.operation-memory/recipes` in the current project. |
| `opmem add <recipe-file>` | Validate and copy a YAML recipe into the local store. |
| `opmem list` | List stored recipes. |
| `opmem search <query>` | Rank text matches across id, name, description, scope, intent, steps, and failure patterns. |
| `opmem show <recipe-id>` | Print a stored recipe summary. |
| `opmem validate [recipe-files...]` | Validate recipe files, or the stored recipes if no files are passed. |

All commands support `--json`.

## Recipe Shape

Recipes are YAML files with an id, name, description, scope, intent, risk, steps, success conditions, failure patterns, policy, and metadata. See `examples/recipes/*.yml` for complete examples.

```yaml
id: cms-save-draft
name: Save CMS article as draft
description: Save an edited CMS article without publishing it.
scope:
  kind: web
  domain: cms.example.com
  tool: browser
intent:
  description: Preserve article edits in draft state for later human review.
risk: draft
steps:
  - description: Click Save Draft, not Publish.
success_conditions:
  - The CMS shows a saved draft confirmation.
failure_patterns:
  - pattern: Publish button is the only visible primary action
    meaning: Saving a draft may be unavailable in this workflow state.
policy:
  allowed_modes:
    - assisted
metadata:
  created_at: "2026-05-05T00:00:00Z"
  updated_at: "2026-05-05T00:00:00Z"
  confidence: medium
```

## Security Policy

Operation Memory is local-first. The CLI does not send recipe contents over the network. The MVP writes recipes under `.operation-memory/recipes` in the current project when initialized, otherwise under `~/.operation-memory/recipes`.

Treat operational recipes as sensitive when they include infrastructure names, customer impact, incident details, or internal commands. Do not store cookies, tokens, passwords, private keys, personal information, customer data, regulated data, full DOM snapshots, or raw screenshot data in recipes. If sensitive material is committed by mistake, remove it from the recipe, rotate exposed credentials, and follow normal repository secret-removal procedures.

Use the `risk` and `policy.requires_confirmation` fields to mark procedures that need human confirmation before execution. The initial policy is:

- `read`: confirmation is not required.
- `draft`: confirmation is optional.
- `prefill`: confirmation is required before submission.
- `write`, `destructive`, `real_world`: confirmation is required.

`policy.allowed_modes` is a typed list. Allowed values are `manual`, `assisted`, `prefill`, `confirm`, and `auto_readonly`.

See `SECURITY.md` for review guidance and `SPEC.md` for the recipe lifecycle, risk model, execution modes, and non-goals.

## MVP Notes

The CLI delegates storage, recipe validation, policy, and search behavior to the TypeScript modules under `src/`. The command surface is intentionally small so the backing store and search implementation can evolve without changing common workflows.
