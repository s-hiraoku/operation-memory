# Operation Memory

Operation Memory is a local-first CLI for storing operational recipes: short, validated YAML procedures for work that needs to stay searchable after chat threads, tickets, and handoff notes move on.

Use it for release handoffs, incident review steps, rollout checks, recovery notes, CMS draft handling, and other repeatable operational procedures. The MVP is deliberately non-executing: it stores, validates, lists, searches, and shows recipes, but it never runs recipe steps, `suggested_command`, shell commands, browser actions, or MCP calls.

Example: after a release, store the rollback trigger, validation signal, and owner as a recipe. Next time someone searches `rollback release`, they can find the handoff without digging through chat.

The full getting-started path is in the [GitHub Pages user guide](docs/index.md).

## Try It In 2 Minutes

Prerequisite: Node.js 20 or newer.

From a fresh checkout:

```sh
npm install
npm run build
node dist/cli.js init
node dist/cli.js add examples/recipes/release-handoff.yml
node dist/cli.js list
node dist/cli.js search "rollback release"
node dist/cli.js show release-handoff
node dist/cli.js validate
```

That creates a project-local store at `.operation-memory/recipes/`, adds a validated example recipe, searches for it, prints the stored recipe summary, and validates the store.

If you link or install the package, use `opmem` instead of `node dist/cli.js`:

```sh
opmem init
opmem add examples/recipes/incident-review.yml
opmem list
opmem search "customer impact"
```

If you want to write your own recipe, start by copying an example and editing the plain-language fields:

```sh
cp examples/recipes/cms-save-draft.yml my-recipe.yml
node dist/cli.js validate my-recipe.yml
node dist/cli.js add my-recipe.yml
```

## What Operation Memory Is For

Operation Memory covers the layer between chat, tickets, and polished documentation:

- Store reusable operational procedures as reviewable YAML.
- Validate recipe shape and hard policy invariants before adding recipes.
- Keep recipes project-local under `.operation-memory/recipes` or personal under `~/.operation-memory/recipes`.
- Search recipes deterministically on your machine.
- Mark risk, allowed usage modes, confirmation expectations, success conditions, and failure patterns.

It is not an execution system, RPA runner, vector database, issue tracker, observability backend, or MCP server. Recipe steps are guidance for humans and agents to read.

## Common Commands

| Command | Purpose |
| --- | --- |
| `opmem init` | Create `.operation-memory/recipes` in the current project. |
| `opmem add <recipe-file>` | Validate and copy a YAML recipe into the active store. |
| `opmem list` | List stored recipes. |
| `opmem search <query>` | Rank text matches across recipe content. |
| `opmem show <recipe-id>` | Print one stored recipe summary. |
| `opmem validate [recipe-files...]` | Validate recipe files, or validate the active store when no files are passed. |

Every command supports `--json`.

## Recipe Example

Recipes are YAML files with a stable id, scope, intent, risk, steps, success conditions, failure patterns, policy, and metadata.

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
    guidance: Stop if Publish is the only available primary action.
success_conditions:
  - The CMS shows a saved draft confirmation.
  - The article remains unpublished.
failure_patterns:
  - pattern: Publish button is the only visible primary action
    meaning: Saving a draft may be unavailable in this workflow state.
    recovery: Stop and ask an editor whether to continue.
policy:
  requires_confirmation: false
  allowed_modes:
    - assisted
metadata:
  created_at: "2026-05-05T00:00:00.000Z"
  updated_at: "2026-05-05T00:00:00.000Z"
  confidence: medium
```

Complete examples live in [`examples/recipes/`](examples/recipes/). Recipe writing guidance lives in [docs/recipe-quality.md](docs/recipe-quality.md).

## Store Location

`opmem init` creates a project-local store:

```text
.operation-memory/recipes/
```

When that directory exists in the current project, Operation Memory reads and writes there. If it does not exist, commands use the personal fallback:

```text
~/.operation-memory/recipes/
```

Use a project-local store for team or repository recipes. Use the home-directory fallback for personal procedures that should be available across projects.

## Safety Rules

Treat recipes as sensitive when they mention infrastructure, incidents, customers, releases, internal procedures, or commands.

Do not store cookies, tokens, passwords, private keys, session IDs, personal data, customer data, regulated data, raw logs, raw DOM snapshots, screenshots, HAR files, browser storage, signed URLs, or production-only hostnames when placeholders would work.

For high-impact recipes, use `risk`, `policy.requires_confirmation`, and step-level confirmation guidance:

| Risk | Use For | Confirmation |
| --- | --- | --- |
| `read` | Inspection only. | Not required. |
| `draft` | Drafting, saving, or recording without external effect. | Optional. |
| `prefill` | Preparing a form, message, patch, or command for review. | Required before submission. |
| `write` | Changing local or remote state. | Required. |
| `destructive` | Deleting, overwriting, rolling back, disabling, or risking data loss. | Required. |
| `real_world` | Affecting people, money, legal obligations, external communications, or physical-world outcomes. | Required. |

Validation rejects `write`, `destructive`, and `real_world` recipes that explicitly disable confirmation.

## Verify This Repository

Run the full project verification loop:

```sh
npm run verify
```

For a quick end-to-end CLI smoke check:

```sh
npm run build
npm run smoke
```

The smoke check creates a temporary recipe store, adds examples, lists recipes, searches, shows one recipe, validates the store, and deletes the temporary store.

## More Documentation

- [User Guide](docs/index.md): first-use tutorial, command reference, troubleshooting, and recipe authoring flow.
- [Recipe Quality Guide](docs/recipe-quality.md): examples of good and risky recipes.
- [Security Policy](SECURITY.md): review guidance for sensitive operational content.
- [Specification](SPEC.md): lifecycle, risk model, execution modes, and non-goals.
- [Codex Harness](docs/harness.md): repository-specific development harness and verification workflow.
