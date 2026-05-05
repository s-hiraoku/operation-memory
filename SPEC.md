# Operation Memory Specification

Operation Memory is local-first procedural memory for AI agents and human operators. It stores validated recipes for operating tools such as web apps, CLIs, Git, IDEs, SaaS products, cloud consoles, and MCP-capable systems.

The MVP is a recipe management tool. It validates YAML recipes, stores them on the filesystem, searches them deterministically, and exposes a small CLI. It does not execute recipe steps.

Recipe steps are descriptive guidance only. Fields such as `suggested_command` or `guidance` are examples for an operator or agent to read; the MVP never executes shell commands, browser actions, MCP calls, or any other step content.

## Concept

A recipe captures how to perform an operation:

- What the operation is for
- Where it applies
- What risk level it carries
- Which execution modes are allowed
- Which steps are expected
- What success looks like
- What failures mean and how to recover
- Whether human confirmation is required

This lets an agent retrieve operational procedure before acting, without storing credentials or raw interaction logs.

## Differences

- Memory stores user or project context. Operation Memory stores reusable procedures for operations.
- RAG retrieves documents. Operation Memory retrieves structured, schema-validated recipes with risk and policy fields.
- MCP gives tools an official AI-facing API. Operation Memory remains useful when a tool has no MCP server or when the procedure around an MCP call matters.
- WebMCP is an official operation surface exposed by a web application. Operation Memory is agent-side local procedure memory for existing tools and sites that may not expose WebMCP.
- Skills package agent capabilities and instructions. Operation Memory stores local operational experience that can be searched and reviewed independently.
- Observability records system behavior and telemetry. Operation Memory records what operators should do, what can fail, and when to confirm.
- RPA executes scripted workflows. Operation Memory records procedural knowledge; this MVP is explicitly non-executing.

## Recipe Lifecycle

1. Draft: a recipe is written as YAML from a known operation pattern.
2. Validate: `opmem validate <recipe-file>` checks schema, risk, execution modes, and policy constraints.
3. Add: `opmem add <recipe-file>` writes the validated recipe to the local store.
4. Discover: `opmem list`, `opmem search <query>`, and `opmem show <id>` retrieve recipes before work begins.
5. Review: humans update confidence, verification dates, failure patterns, and safety policy as experience changes.
6. Retire: stale or unsafe recipes should be removed from the local store and repository.

## Risk Model

Allowed risks:

- `read`: inspection only; confirmation is not required.
- `draft`: prepares or records a draft; confirmation is optional.
- `prefill`: fills fields or prepares submission; confirmation is required before submission.
- `write`: changes remote or local state; confirmation is required.
- `destructive`: deletes, overwrites, rolls back, disables, or otherwise risks loss; confirmation is required.
- `real_world`: affects people, money, legal obligations, external communications, or physical-world outcomes; confirmation is required.

Validation rejects `write`, `destructive`, and `real_world` recipes that set `policy.requires_confirmation: false`.

## Execution Modes

Allowed execution modes:

| Mode | Who acts | Allowed behavior | Boundary |
| --- | --- | --- | --- |
| `manual` | Human operator | The recipe is read as a checklist or reference. | The agent must not prepare changes, fill fields, or execute steps. |
| `assisted` | Human operator with agent guidance | The agent may explain steps, summarize context, draft checklists, and point to suggested commands. | The human remains the actor; the agent must not submit, write, delete, or execute commands. |
| `prefill` | Agent prepares, human submits | The agent may prepare text, forms, patches, or command suggestions for review. | The agent must stop before any submission, write, external send, or state change. |
| `confirm` | Agent proceeds only after explicit human approval | The agent may prepare a high-risk operation and ask for confirmation at the marked point. | Confirmation must be explicit and operation-specific; no blanket approval is implied. |
| `auto_readonly` | Agent performs read-only retrieval or inspection | The agent may collect non-sensitive read-only information where a future adapter allows it. | No writes, submissions, mutations, secrets, raw DOM dumps, raw screenshots, or log collection. |

These are policy labels. The MVP does not execute any mode automatically.

## Future Audit Command

A future `opmem audit` command should review recipes for secret-looking values, raw URLs or environment-specific identifiers, customer identifiers, prohibited raw data, and unsafe policy combinations. This is intentionally not implemented in the MVP. See `docs/audit.md` for the design.

## Non-Goals

The MVP does not include:

- Playwright or browser automation
- CLI command execution
- MCP server hosting
- Embedding or vector search
- Automatic log collection
- AI-generated recipe creation
- Global sharing or synchronization
- Credential, cookie, password, personal data, raw DOM, or raw screenshot storage
