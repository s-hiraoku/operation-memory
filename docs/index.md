---
layout: default
title: User Guide
---

# Operation Memory User Guide

Operation Memory is a local-first command line tool for storing operational recipes. A recipe is a structured YAML checklist for repeatable work such as release handoffs, incident reviews, rollout checks, CMS draft handling, and recovery procedures.

Use this guide when you want to install `opmem`, create a local recipe store, add recipes, search them, and write recipes that are safe to share in a repository.

## What Operation Memory Does

Operation Memory helps you keep procedural knowledge outside chat threads and ticket comments:

- Store operational procedures as validated YAML files.
- Keep recipes in the current project or in your home directory.
- Search recipes deterministically before starting an operation.
- Mark each recipe with risk, policy, and allowed execution modes.
- Review success conditions, failure patterns, and recovery notes.

The MVP does not execute recipe steps. It never runs `suggested_command`, browser actions, shell commands, MCP calls, or any other recipe content.

## Installation

Operation Memory requires Node.js 20 or newer.

```sh
npm install
npm run build
```

During development, run the CLI from the built output:

```sh
node dist/cli.js --help
```

After package linking or installation, use:

```sh
opmem --help
```

## Create A Recipe Store

Initialize a project-local store:

```sh
opmem init
```

This creates:

```text
.operation-memory/recipes/
```

When this directory exists in the current project, `opmem` reads and writes recipes there. If the current project has not been initialized, `opmem` falls back to:

```text
~/.operation-memory/recipes/
```

Use a project-local store when recipes belong to a repository or team workflow. Use the home-directory fallback for personal recipes that should work across projects.

## Add Your First Recipe

Start with one of the example recipes:

```sh
opmem add examples/recipes/release-handoff.yml
```

The command validates the YAML first. If the recipe is valid, it is copied into the active recipe store as:

```text
<recipe-id>.yml
```

For `release-handoff`, the stored file is:

```text
.operation-memory/recipes/release-handoff.yml
```

## Common Commands

List stored recipes:

```sh
opmem list
```

Search recipes:

```sh
opmem search "rollback release"
```

Show one recipe:

```sh
opmem show release-handoff
```

Validate one or more recipe files before adding them:

```sh
opmem validate examples/recipes/incident-review.yml examples/recipes/release-handoff.yml
```

Validate the recipes already in the active store:

```sh
opmem validate
```

Every command supports JSON output:

```sh
opmem search "customer impact" --json
```

## Recipe Format

A recipe is a YAML file with typed fields. This is a minimal complete example:

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

### Required Fields

| Field | Purpose |
| --- | --- |
| `id` | Stable identifier used by `opmem show <recipe-id>` and the stored filename. |
| `name` | Human-readable recipe title. |
| `description` | Short summary of what the operation does. |
| `scope` | Where the recipe applies, such as a web app, CLI, Git workflow, cloud system, or SaaS tool. |
| `intent` | Why the operation exists and what outcome it supports. |
| `risk` | Impact level for the operation. |
| `steps` | Descriptive checklist steps. |
| `metadata` | Creation, update, and confidence information. |

Optional fields such as `inputs`, `success_conditions`, `failure_patterns`, and `policy` should still be included for useful operational recipes.

## Risk Levels

Choose the lowest accurate risk level:

| Risk | Use For | Confirmation |
| --- | --- | --- |
| `read` | Inspection only. | Not required. |
| `draft` | Drafting, saving, or recording without external effect. | Optional. |
| `prefill` | Preparing a form, message, patch, or command for human review. | Required before submission. |
| `write` | Changing local or remote state. | Required. |
| `destructive` | Deleting, overwriting, rolling back, disabling, or risking data loss. | Required. |
| `real_world` | Affecting people, money, legal obligations, external communications, or physical-world outcomes. | Required. |

Validation rejects `write`, `destructive`, and `real_world` recipes that explicitly set:

```yaml
policy:
  requires_confirmation: false
```

## Execution Modes

`policy.allowed_modes` describes how a human or agent may use the recipe. These are policy labels only; the MVP does not execute them.

| Mode | Meaning |
| --- | --- |
| `manual` | A human reads the recipe as a checklist or reference. |
| `assisted` | An agent may explain steps or summarize context while the human remains the actor. |
| `prefill` | An agent may prepare text, forms, patches, or command suggestions, then stop before submission. |
| `confirm` | An agent may proceed only after explicit operation-specific approval. |
| `auto_readonly` | An agent may perform read-only retrieval or inspection where a future adapter allows it. |

## Search Behavior

`opmem search <query>` ranks text matches across recipe content, including:

- `id`
- `name`
- `description`
- `scope`
- `intent`
- `steps`
- `failure_patterns`

Use practical phrases rather than exact titles:

```sh
opmem search "rollback"
opmem search "customer impact"
opmem search "save draft"
opmem search "rollout check"
```

Search is deterministic and local. Recipe contents are not sent over the network.

## Writing Good Recipes

Good recipes are reusable operational guidance, not transcripts. Before adding a recipe:

- Replace sensitive concrete values with placeholders and `inputs`.
- Use `guidance` for prose and `suggested_command` only for examples.
- Add success conditions that an operator can check.
- Add failure patterns with meaning and recovery guidance.
- Choose `risk` and `policy.allowed_modes` deliberately.
- Add confirmation points for high-impact operations.
- Run `opmem validate <recipe-file>`.

Prefer this:

```yaml
inputs:
  - name: namespace
    required: true
  - name: deployment
    required: true
steps:
  - description: Check rollout status for the requested deployment.
    suggested_command: kubectl rollout status deployment/<deployment> -n <namespace>
```

Avoid this:

```yaml
steps:
  - description: Run a one-off production command copied from shell history.
```

For more detail, see the [Recipe Quality Guide](recipe-quality.md).

## Security Guidance

Treat operational recipes as sensitive when they mention infrastructure, incidents, customers, releases, or internal procedures.

Do not store:

- Cookies, tokens, passwords, private keys, or session IDs.
- Personal information or customer data.
- Regulated data.
- Raw logs, raw DOM snapshots, raw screenshots, HAR files, or SaaS exports.
- Internal account IDs, signed URLs, or production-only hostnames when placeholders would work.

If sensitive material is committed by mistake, remove it from the recipe, rotate any exposed credentials, and follow your repository's secret-removal process.

See the [security policy](https://github.com/s-hiraoku/operation-memory/blob/main/SECURITY.md) for review guidance.

## Troubleshooting

### `Recipe not found`

Check that you are in the same project where you ran `opmem init`, then run:

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

Try broader operational words:

```sh
opmem search "release"
opmem search "incident"
opmem search "rollback"
```

Also confirm the recipe was added to the active store:

```sh
opmem list
```

## Next Steps

- Read the [Recipe Quality Guide](recipe-quality.md).
- Review the [Operation Memory Specification](https://github.com/s-hiraoku/operation-memory/blob/main/SPEC.md).
- Inspect complete examples in [`examples/recipes/`](https://github.com/s-hiraoku/operation-memory/tree/main/examples/recipes).
