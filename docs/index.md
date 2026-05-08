---
layout: default
title: User Guide
---

# Operation Memory User Guide

Operation Memory is a local-first CLI for storing operational recipes. A recipe is a structured YAML checklist for repeatable work such as release handoffs, incident reviews, rollout checks, CMS draft handling, and recovery procedures.

Follow this guide to get from a fresh checkout to a working recipe store you can add to, search, validate, and review.

## Fast Path

If you only want to prove the tool works, run this from a checkout:

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

Success means:

- `list` shows `release-handoff`.
- `search "rollback release"` finds the release handoff recipe.
- `show release-handoff` prints the stored recipe summary.
- `validate` reports the active store is valid.

## What You Will Have

After the first-use flow, you will have:

- A built CLI you can run from this checkout.
- A local recipe store at `.operation-memory/recipes/`.
- Two example recipes stored locally.
- A working search flow for finding operational guidance.
- A template for writing your own recipe safely.

The MVP does not execute recipe steps. It never runs `suggested_command`, browser actions, shell commands, MCP calls, or any other recipe content. Recipes are guidance, not automation.

## Prerequisites

Install Node.js 20 or newer, then install dependencies:

```sh
npm install
```

Build the CLI:

```sh
npm run build
```

When working from this repository, run the CLI as:

```sh
node dist/cli.js --help
```

After package linking or installation, the same commands are available as `opmem`:

```sh
opmem --help
```

The examples below use `node dist/cli.js` so they work immediately from a checkout. If you have linked or installed the package, replace `node dist/cli.js` with `opmem`.

## First Use: Create, Add, Search, Show

Create a project-local recipe store:

```sh
node dist/cli.js init
```

This creates:

```text
.operation-memory/recipes/
```

Add the release handoff example:

```sh
node dist/cli.js add examples/recipes/release-handoff.yml
```

Add the incident review example:

```sh
node dist/cli.js add examples/recipes/incident-review.yml
```

List the stored recipes. You should see `release-handoff` and `incident-review`:

```sh
node dist/cli.js list
```

Search by operational language, not just exact recipe titles:

```sh
node dist/cli.js search "rollback release"
node dist/cli.js search "customer impact"
```

Show one stored recipe:

```sh
node dist/cli.js show release-handoff
```

Validate the active store. This checks the recipes you added:

```sh
node dist/cli.js validate
```

At this point Operation Memory is usable: you can add YAML recipes, search them before starting operational work, show the matching recipe, and validate that stored recipes still satisfy the schema and hard safety rules.

## Store Location

Operation Memory chooses the active store from your current working directory:

1. If `.operation-memory/recipes/` exists in the current project, commands read and write there.
2. Otherwise, commands use the personal fallback at `~/.operation-memory/recipes/`.

Use a project-local store when recipes belong to a repository or team workflow. Use the home-directory fallback for personal recipes that should be available across projects.

The `add` command copies a validated recipe into the active store as:

```text
<recipe-id>.yml
```

For example, adding `examples/recipes/release-handoff.yml` stores:

```text
.operation-memory/recipes/release-handoff.yml
```

## Command Reference

| Command | What It Does | Common Use |
| --- | --- | --- |
| `init` | Creates `.operation-memory/recipes` in the current directory. | Start a project-local recipe store. |
| `add <recipe-file>` | Validates a YAML recipe and copies it into the active store. | Add a new operational procedure. |
| `list` | Lists stored recipes. | See what is available before searching. |
| `search <query>` | Ranks text matches across recipe content. | Find a procedure by practical terms such as `rollback`, `customer impact`, or `save draft`. |
| `show <recipe-id>` | Prints one stored recipe summary. | Review the procedure before using it. |
| `validate [recipe-files...]` | Validates passed files, or the active store when no files are passed. | Check a recipe before adding it, or check the whole store. |

Every command supports JSON output:

```sh
node dist/cli.js search "customer impact" --json
node dist/cli.js validate --json
```

## Write Your First Recipe By Copying An Example

The easiest way to start is to copy a working example, then edit the plain-language fields. Do not start from a blank file unless you already know the schema.

```sh
cp examples/recipes/cms-save-draft.yml my-recipe.yml
```

Open `my-recipe.yml` and edit these fields first:

- `id`: change this to a stable lowercase identifier, such as `release-rollback-check`.
- `name`: write the human-readable title.
- `description`: summarize the operation in one sentence.
- `scope`: describe the tool, project, app, or command family where the recipe applies.
- `intent.description`: explain why this operation exists.
- `steps`: replace the checklist with reusable steps.
- `success_conditions`: list what proves the operation is complete.
- `failure_patterns`: list common ways the operation gets stuck and what to do next.

For example, a safe draft recipe looks like this:

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
inputs:
  - name: article
    description: Draft article or CMS entry to save.
    required: true
steps:
  - description: Open the requested article in the CMS editor.
    guidance: Confirm the title matches the request before changing anything.
  - description: Save the article as a draft.
    guidance: Click Save Draft, not Publish.
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

Validate your edited file before adding it:

```sh
node dist/cli.js validate my-recipe.yml
```

Add it to the active store:

```sh
node dist/cli.js add my-recipe.yml
```

Find it by terms an operator would naturally remember:

```sh
node dist/cli.js search "save draft"
```

Show it:

```sh
node dist/cli.js show cms-save-draft
```

If you changed the `id`, use your new id in the `show` command.

Good first edits are small: change one example into one real procedure, validate it, add it, and search for it. Once that works, write more recipes the same way.

## Recipe Fields

Required fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable identifier used by `show <recipe-id>` and the stored filename. |
| `name` | Human-readable title. |
| `description` | Short summary of what the operation does. |
| `scope` | Where the recipe applies, such as a web app, CLI, Git workflow, cloud system, or SaaS tool. |
| `intent` | Why the operation exists and what outcome it supports. |
| `risk` | Impact level for the operation. |
| `steps` | Descriptive checklist steps. |
| `metadata` | Creation, update, and confidence information. |

Strongly recommended fields:

| Field | Why It Helps |
| --- | --- |
| `inputs` | Names the placeholders an operator must provide. |
| `success_conditions` | Makes completion checkable. |
| `failure_patterns` | Captures known symptoms, meaning, and recovery guidance. |
| `policy` | Describes confirmation expectations and allowed usage modes. |

Use `guidance` for prose. Use `suggested_command` only for non-executed command examples:

```yaml
steps:
  - description: Check rollout status for the requested deployment.
    guidance: Stop if the current cluster context does not match the request.
    suggested_command: kubectl rollout status deployment/<deployment> -n <namespace>
```

Operation Memory stores that command as text. It does not run it.

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

`search <query>` ranks text matches across:

- `id`
- `name`
- `description`
- `scope`
- `intent`
- `steps`
- `failure_patterns`

Search is deterministic and local. Recipe contents are not sent over the network.

Good queries use the words someone would remember during work:

```sh
node dist/cli.js search "rollback"
node dist/cli.js search "customer impact"
node dist/cli.js search "save draft"
node dist/cli.js search "rollout check"
```

## Writing Safe, Useful Recipes

Before adding a recipe:

- Replace sensitive concrete values with placeholders and `inputs`.
- Use `guidance` for prose and `suggested_command` only for examples.
- Add success conditions that an operator can check.
- Add failure patterns with meaning and recovery guidance.
- Choose `risk` and `policy.allowed_modes` deliberately.
- Add confirmation points for high-impact operations.
- Run `validate <recipe-file>`.

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
```

Avoid one-off operational transcripts:

```yaml
steps:
  - description: Run a production command copied from shell history.
```

For deeper examples, see the [Recipe Quality Guide](recipe-quality.md).

## Security Guidance

Treat operational recipes as sensitive when they mention infrastructure, incidents, customers, releases, or internal procedures.

Do not store:

- Cookies, tokens, passwords, private keys, or session IDs.
- Personal information or customer data.
- Regulated data.
- Raw logs, raw DOM snapshots, raw screenshots, HAR files, browser storage, or SaaS exports.
- Internal account IDs, signed URLs, or production-only hostnames when placeholders would work.

If sensitive material is committed by mistake, remove it from the recipe, rotate any exposed credentials, and follow your repository's secret-removal process.

See the [security policy](https://github.com/s-hiraoku/operation-memory/blob/main/SECURITY.md) for review guidance.

## Troubleshooting

### `opmem` Command Not Found

From a repository checkout, use:

```sh
node dist/cli.js --help
```

If `dist/cli.js` does not exist, build first:

```sh
npm run build
```

Use `opmem` only after linking or installing the package.

### Recipe Not Found

Check the active store:

```sh
node dist/cli.js list
```

If the recipe is missing, confirm you are in the project where you ran `init`. If no project-local `.operation-memory/recipes/` directory exists, Operation Memory may be reading from `~/.operation-memory/recipes/`.

### Validation Fails

Run validation against the file you are editing:

```sh
node dist/cli.js validate <recipe-file>
```

Common causes include missing required fields, invalid risk names, invalid execution modes, timestamps that are not ISO datetimes, and high-risk recipes that disable confirmation.

### Search Returns Nothing

Confirm recipes were added:

```sh
node dist/cli.js list
```

Then try broader operational words:

```sh
node dist/cli.js search "release"
node dist/cli.js search "incident"
node dist/cli.js search "rollback"
```

### I Want To Confirm The Whole MVP Works

Run the smoke check:

```sh
npm run build
npm run smoke
```

The smoke check creates a temporary store, adds example recipes, lists recipes, searches, shows one recipe, validates the store, and removes the temporary store.

## Next Steps

- Read the [Recipe Quality Guide](recipe-quality.md).
- Review the [Operation Memory Specification](https://github.com/s-hiraoku/operation-memory/blob/main/SPEC.md).
- Inspect complete examples in [`examples/recipes/`](https://github.com/s-hiraoku/operation-memory/tree/main/examples/recipes).
- For repository development workflow, see the [Codex Harness](harness.md).
