# `opmem audit` Design

`opmem audit` is a future advisory review command for Operation Memory recipes. It is not implemented in the MVP.

The command should inspect recipe files and report safety, privacy, and policy concerns without executing recipe steps, shell commands, browser actions, MCP calls, or suggested commands.

## Goals

- Help reviewers catch sensitive or unsafe recipe content before recipes are committed or shared.
- Make repository review easier for public examples and project-local recipe stores.
- Keep the tool non-executing and deterministic.
- Produce machine-readable output suitable for CI in later versions.

## Non-Goals

- No Playwright or browser automation.
- No shell command execution.
- No MCP server or MCP call execution.
- No embedding or vector search.
- No automatic log collection.
- No automatic redaction or mutation of recipe files in the first version.

## Checks

The first implementation should check for these categories.

| Category | Examples | Suggested Severity |
| --- | --- | --- |
| Secret-looking values | API keys, bearer tokens, private keys, session IDs, password-like fields | `error` |
| Raw URLs with environment-specific identifiers | Internal hostnames, tenant URLs, account-specific cloud console links, signed URLs | `warning` or `error` |
| Customer identifiers | Customer names, account IDs, incident payload identifiers, ticket bodies copied from support systems | `warning` |
| Emails or personal data | Email addresses, phone numbers, names paired with operational context | `warning` or `error` |
| Raw browser artifacts | DOM snapshots, screenshots, HAR files, browser storage dumps, copied SaaS exports | `error` |
| Unsafe policy combinations | High-risk recipes with weak modes, missing confirmation points, missing success conditions | `warning` or `error` |
| Rejected legacy fields | `steps[].action` or other executable-looking legacy fields | `error` |
| Suggested command risks | `rm -rf`, force pushes, destructive cloud flags, irreversible deletes, secrets in flags or environment variables | `warning` or `error` |

The audit should prefer conservative warnings over silent acceptance. False positives are acceptable in early versions if findings are clear and easy to review.

## Severity Levels

| Severity | Meaning | Suggested Exit Behavior |
| --- | --- | --- |
| `info` | Review note or best-practice reminder. | Exit 0. |
| `warning` | Potentially sensitive or unsafe content requiring human review. | Exit 0 by default; future CI mode may fail. |
| `error` | Content violates Operation Memory policy or schema safety expectations. | Exit non-zero. |

## High-Impact Operations

For `write`, `destructive`, and `real_world` recipes, audit should check:

- `policy.requires_confirmation` is not false. Schema validation already rejects this.
- `allowed_modes` does not imply unattended mutation.
- Steps include explicit confirmation points when the procedure reaches a state change.
- `success_conditions` and recovery guidance are present.
- `suggested_command` does not include irreversible flags without review guidance.

## Output Shape

A future JSON output should be stable enough for CI:

```json
{
  "ok": false,
  "findings": [
    {
      "severity": "error",
      "code": "secret-looking-value",
      "file": "examples/recipes/example.yml",
      "path": "steps[1].suggested_command",
      "message": "Suggested command appears to contain a token-like value."
    }
  ]
}
```

## Relationship to Validation

`opmem validate` checks schema and hard safety invariants. `opmem audit` should check advisory content quality and sensitive-data risks.

Validation should remain strict and deterministic. Audit may be heuristic and should explain why each finding was raised.
