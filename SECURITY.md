# Security Policy

Operation Memory is local-first procedural memory. Recipes should preserve safe operating knowledge, not sensitive raw data.

## Data That Must Not Be Stored

Do not store:

- Cookies, session identifiers, API tokens, passwords, private keys, or signing secrets
- Personal information, customer data, regulated data, or private message contents
- Full DOM snapshots, raw screenshots, HAR files, browser storage dumps, or copied SaaS exports
- Unredacted incident payloads, logs, stack traces, or database records that contain sensitive values
- Credentials embedded in CLI commands, URLs, headers, environment variables, or config snippets

URLs are not always forbidden. Public documentation URLs, stable product docs, and placeholder URLs can be useful. Avoid signed URLs, token-bearing URLs, tenant/account-specific URLs, and internal hostnames unless they are abstracted into placeholders.

Store stable procedure, risk, expected state, failure meaning, and recovery guidance instead.

Recipe steps are descriptive guidance only. This MVP never executes `suggested_command`, shell commands, browser actions, MCP calls, or any other step content.

Legacy `steps[].action` fields are rejected by the schema because they look executable. Use `steps[].guidance` for prose and `steps[].suggested_command` for non-executed command examples.

## Recipe Review Checklist

Before adding or committing a recipe, check that:

- The recipe validates with `opmem validate`.
- `scope`, `intent`, `risk`, `policy.allowed_modes`, and `metadata.confidence` are explicit.
- Steps describe what to inspect or do, without executing anything automatically.
- Failure patterns describe meaning and recovery without copying sensitive raw output.
- Any command examples are redacted and do not contain credentials, customer identifiers, or private URLs.
- `write`, `destructive`, and `real_world` recipes do not set `requires_confirmation: false`.
- Public repository examples use placeholder domains, projects, clusters, tickets, and service names.

## Public Repository Guidance

Treat recipes as reviewable source files. For public repositories:

- Prefer examples with fake domains such as `example.com` and generic project names.
- Avoid internal hostnames, account IDs, tenant names, customer names, and production incident details.
- Do not publish recipes copied from private runbooks unless they have been reviewed and redacted.
- Review generated recipes the same way you would review generated code that touches operations.

## High-Impact Operations

Recipes with `write`, `destructive`, or `real_world` risk require human confirmation. Schema validation rejects recipes that try to disable confirmation for those risks.

For these recipes:

- Use `allowed_modes: [manual]`, `allowed_modes: [assisted]`, or `allowed_modes: [confirm]` unless a stricter project policy exists.
- Include success conditions and rollback or recovery guidance.
- Make confirmation points explicit in the steps.
- Do not store commands that embed secrets or irreversible parameters.

This MVP is non-executing. It does not run shell commands, automate browsers, start an MCP server, generate embeddings, or collect logs automatically.

A future `opmem audit` command may check for secret-looking values, raw URLs, customer identifiers, and unsafe policy combinations. That audit command is not part of this MVP. See `docs/audit.md` for the design.
