---
layout: default
title: User Guide
description: Install, use, and write safe Operation Memory recipes.
---

# Operation Memory User Guide

Operation Memory is a local-first CLI for reusable operational recipes. A recipe is a validated YAML checklist for repeatable work such as release handoffs, incident reviews, rollout checks, CMS draft handling, and recovery procedures.

Use `opmem` when a useful procedure is too structured to leave in chat, but too lightweight to become a full runbook.

## At A Glance

Operation Memory helps teams and agents:

- Keep operational procedures as reviewable YAML files.
- Validate recipes before storing or sharing them.
- Search local recipes before starting work.
- Record risk, confirmation requirements, success conditions, and recovery guidance.
- Avoid storing secrets, customer data, raw logs, browser dumps, or copied incident payloads.

The MVP is intentionally non-executing. It never runs recipe steps, `suggested_command`, shell commands, browser actions, MCP calls, or any other recipe content.

## Quickstart

Install dependencies and build the CLI:

```sh
npm install
npm run build
```

Initialize a project-local recipe store:

```sh
node dist/cli.js init
```

Add an example recipe:

```sh
node dist/cli.js add examples/recipes/release-handoff.yml
```

Search before an operation:

```sh
node dist/cli.js search "rollback release"
```

Inspect the matching recipe:

```sh
node dist/cli.js show release-handoff
```

After package linking or installation, use `opmem` instead of `node dist/cli.js`:

```sh
opmem search "rollback release"
```

## Core Workflow

1. Draft a recipe as YAML.
2. Validate it with `opmem validate <recipe-file>`.
3. Add it with `opmem add <recipe-file>`.
4. Discover it later with `opmem list`, `opmem search <query>`, or `opmem show <recipe-id>`.
5. Review it over time as the operation, risk, owner, or recovery path changes.

Recipes should capture the reusable procedure, not a raw transcript of one execution.

## Recipe Store Location

`opmem init` creates a project-local store:

```text
.operation-memory/recipes/
```

When this directory exists in the current project, `opmem` reads and writes recipes there. If the project has not been initialized, `opmem` falls back to:

```text
~/.operation-memory/recipes/
```

Use a project-local store for procedures that should be reviewed with a repository. Use the home-directory fallback for personal recipes that should be available across projects.

## Command Reference

All commands support `--json`.

| Command | Purpose | Example |
| --- | --- | --- |
| `opmem init` | Create `.operation-memory/recipes` in the current project. | `opmem init` |
| `opmem add <recipe-file>` | Validate and copy a recipe into the active store. | `opmem add examples/recipes/release-handoff.yml` |
| `opmem list` | List stored recipes. | `opmem list --json` |
| `opmem search <query>` | Search stored recipes by operational language. | `opmem search "customer impact"` |
| `opmem show <recipe-id>` | Show one stored recipe. | `opmem show release-handoff` |
| `opmem validate [recipe-files...]` | Validate files, or validate the active store when no files are passed. | `opmem validate examples/recipes/incident-review.yml` |

## Recipe Format

A recipe is a YAML file with typed fields. This example is intentionally small but complete:

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
    expected_result: The CMS confirms the draft was saved.
success_conditions:
  - The CMS shows a saved draft confirmation.
  - The article remains unpublished.
failure_patterns:
  - pattern: Publish button is the only visible primary action
    meaning: Draft saving may be unavailable in this workflow state.
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

### Field Guide

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Stable identifier used by `opmem show <recipe-id>` and the stored filename. |
| `name` | Yes | Human-readable recipe title. |
| `description` | Yes | Short summary of the operation. |
| `scope` | Yes | Where the recipe applies, such as a web app, CLI, Git workflow, cloud system, or SaaS tool. |
| `intent` | Yes | Why the operation exists and what outcome it supports. |
| `risk` | Yes | Impact level for the operation. |
| `inputs` | No | Placeholder values the operator must provide, such as namespace, deployment, release version, or ticket id. |
| `steps` | Yes | Descriptive checklist steps. These are guidance only. |
| `success_conditions` | No | Signals that the operation is complete. Strong recipes include them. |
| `failure_patterns` | No | Known symptoms, meanings, and recovery guidance. Strong recipes include them. |
| `policy` | No | Confirmation requirements and allowed execution modes. |
| `metadata` | Yes | Creation, update, optional verification, success rate, and confidence information. |

### Allowed Scope Kinds

Use the closest stable category for `scope.kind`:

```text
web, cli, git, ide, mcp, cloud, saas, other
```

Add durable context such as `domain`, `project`, `command`, or `tool` when it helps search and review.

## Risk Levels

Choose the lowest accurate risk level.

| Risk | Use For | Confirmation |
| --- | --- | --- |
| `read` | Inspection only. | Not required. |
| `draft` | Drafting, saving, or recording without external effect. | Optional. |
| `prefill` | Preparing a form, message, patch, or command for human review. | Required before submission. |
| `write` | Changing local or remote state. | Required. |
| `destructive` | Deleting, overwriting, rolling back, disabling, or risking data loss. | Required. |
| `real_world` | Affecting people, money, legal obligations, external communications, or physical-world outcomes. | Required. |

Validation rejects `write`, `destructive`, and `real_world` recipes that explicitly disable confirmation:

```yaml
policy:
  requires_confirmation: false
```

## Execution Modes

`policy.allowed_modes` describes how a human or agent may use the recipe. These are policy labels only; the MVP does not execute any mode automatically.

| Mode | Meaning |
| --- | --- |
| `manual` | A human reads the recipe as a checklist or reference. |
| `assisted` | An agent may explain steps, summarize context, and point to suggested commands while the human remains the actor. |
| `prefill` | An agent may prepare text, forms, patches, or command suggestions, then stop before submission. |
| `confirm` | An agent may proceed only after explicit operation-specific approval. |
| `auto_readonly` | An agent may perform read-only retrieval or inspection where a future adapter allows it. |

For high-impact recipes, prefer `manual`, `assisted`, or `confirm`, and make the confirmation point explicit in the steps.

## Search Behavior

`opmem search <query>` ranks text matches across recipe content, including:

- `id`
- `name`
- `description`
- `scope`
- `intent`
- `steps`
- `failure_patterns`

Search with the words an operator would naturally remember:

```sh
opmem search "rollback"
opmem search "customer impact"
opmem search "save draft"
opmem search "rollout check"
```

Search is deterministic and local. Recipe contents are not sent over the network.

## Writing Better Recipes

Good recipes are reusable operating knowledge. They should explain what to inspect, what to prepare, where to stop, what success looks like, and how to recover when a known failure appears.

Before adding a recipe:

- Replace sensitive concrete values with placeholders and `inputs`.
- Use `guidance` for prose and `suggested_command` only for non-executed examples.
- Add success conditions that can be checked without guessing.
- Add failure patterns with meaning and recovery guidance.
- Choose `risk` and `policy.allowed_modes` deliberately.
- Add confirmation points for high-impact operations.
- Run `opmem validate <recipe-file>`.

Prefer reusable placeholders:

```yaml
inputs:
  - name: namespace
    required: true
  - name: deployment
    required: true
steps:
  - description: Check rollout status for the requested deployment.
    suggested_command: kubectl rollout status deployment/<deployment> -n <namespace>
    expected_result: The rollout reports successful completion.
```

Avoid one-off command history:

```yaml
steps:
  - description: Run a production command copied from the last incident.
```

For more examples, see the [Recipe Quality Guide](recipe-quality.md).

## Security Guidance

Treat operational recipes as sensitive when they mention infrastructure, incidents, customers, releases, or internal procedures.

Do not store:

- Cookies, tokens, passwords, private keys, or session IDs.
- Personal information, customer data, regulated data, or private message contents.
- Raw logs, raw DOM snapshots, raw screenshots, HAR files, browser storage, or SaaS exports.
- Internal account IDs, signed URLs, customer names, production-only hostnames, or tenant URLs when placeholders would work.
- Credentials embedded in CLI commands, URLs, headers, environment variables, or config snippets.

If sensitive material is committed by mistake, remove it from the recipe, rotate any exposed credentials, and follow the repository's secret-removal process.

See the [security policy](https://github.com/s-hiraoku/operation-memory/blob/main/SECURITY.md) for review guidance.

## Troubleshooting

### `Recipe not found`

Check that you are in the same project where you ran `opmem init`, then list the active store:

```sh
opmem list
```

If no project-local `.operation-memory/recipes` directory exists, `opmem` may be reading from `~/.operation-memory/recipes/`.

### Validation Fails

Run:

```sh
opmem validate <recipe-file>
```

The output points to the invalid field. Common issues include missing required fields, invalid risk names, invalid execution modes, timestamps that are not ISO datetimes, or high-risk recipes that disable confirmation.

### Search Returns Nothing

Confirm the recipe was added to the active store:

```sh
opmem list
```

Then try broader operational words:

```sh
opmem search "release"
opmem search "incident"
opmem search "rollback"
```

### `opmem` Command Is Not Found

During development, use the built CLI directly:

```sh
node dist/cli.js --help
```

If you expect the `opmem` binary to exist, confirm the package has been linked or installed after running `npm run build`.

## Next Steps

- Read the [Recipe Quality Guide](recipe-quality.md).
- Review the [Operation Memory Specification](https://github.com/s-hiraoku/operation-memory/blob/main/SPEC.md).
- Inspect complete examples in [`examples/recipes/`](https://github.com/s-hiraoku/operation-memory/tree/main/examples/recipes).
