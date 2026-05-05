# Recipe Quality Guide

Operation Recipes are guidance, not automation scripts. They should help an agent or human operator understand a procedure, risk, confirmation point, success signal, and recovery path without storing secrets or raw operational data.

This MVP never executes recipe steps, `suggested_command`, shell commands, browser actions, MCP calls, or any other recipe content.

## Good Recipes

A good Operation Recipe has:

- Clear intent: the recipe says why the operation exists and what outcome it supports.
- Stable scope: the recipe uses durable domains, projects, tools, or command families rather than one-off session details.
- Descriptive non-executing steps: steps explain what to inspect or prepare; command examples live in `suggested_command` and remain non-executed.
- Explicit success conditions: the operator can tell when the procedure is complete.
- Known failure patterns: common symptoms are named with their meaning.
- Recovery guidance: failure patterns include what to check or who to ask next.
- Risk level: `read`, `draft`, `prefill`, `write`, `destructive`, or `real_world` is chosen deliberately.
- Human confirmation points: high-impact operations describe exactly where confirmation is required.

Good recipes favor placeholders over concrete sensitive values:

```yaml
# valid recipe excerpt
scope:
  kind: cloud
  project: production-platform
  command: kubectl rollout status
inputs:
  - name: namespace
    required: true
  - name: deployment
    required: true
steps:
  - description: Confirm the current cluster context matches the intended environment.
    guidance: Stop if the cluster name does not match the request.
  - description: Check rollout status for the requested deployment.
    suggested_command: kubectl rollout status deployment/<deployment> -n <namespace>
success_conditions:
  - The rollout reports successful completion for the requested deployment.
failure_patterns:
  - pattern: context deadline exceeded
    meaning: The rollout may still be progressing or the cluster may be unreachable.
    recovery: Check deployment events and ask before making changes.
```

## Bad Recipes

A bad Operation Recipe includes:

- Raw personal or customer data.
- Raw DOM dumps, screenshots, HAR files, browser storage, copied SaaS exports, or pasted logs.
- Token-like values, passwords, private keys, session IDs, bearer tokens, or signed URLs.
- Environment-specific values without abstraction, such as internal hostnames, account IDs, tenant URLs, or one-off production resource names.
- Signed URLs, token-bearing URLs, tenant/account-specific URLs, and internal hostnames unless they are abstracted into placeholders.
- Executable-looking instructions that imply the MVP will run the step.
- Missing success conditions.
- Missing failure meanings or recovery guidance.
- `write`, `destructive`, or `real_world` actions without confirmation guidance.

Bad recipes often look like transcripts or command history. Operation Memory should store the reusable procedure instead.

## Improvement Examples

### Replace Concrete Values With Placeholders

Before:

```yaml
# partial snippet
scope:
  kind: cloud
  domain: prod-internal.example.invalid
steps:
  - description: Check deployment customer-acme-api in namespace acme-prod.
    suggested_command: kubectl rollout status deployment/customer-acme-api -n acme-prod
```

After:

```yaml
# valid recipe excerpt
scope:
  kind: cloud
  project: production-platform
steps:
  - description: Check the requested deployment in the requested namespace.
    suggested_command: kubectl rollout status deployment/<deployment> -n <namespace>
inputs:
  - name: namespace
    required: true
  - name: deployment
    required: true
```

### Convert Commands Into Non-Executing Suggestions

Before:

```yaml
# partial snippet
steps:
  - description: Run rm -rf on the failed release directory.
```

After:

```yaml
# valid recipe excerpt
steps:
  - description: Identify stale release artifacts after rollback confirmation.
    guidance: Do not remove artifacts until the rollback owner confirms the target path.
    suggested_command: ls <release-artifact-directory>
policy:
  requires_confirmation: true
  allowed_modes:
    - confirm
```

### Add Confirmation Points

Before:

```yaml
# partial snippet
risk: destructive
steps:
  - description: Delete the stale environment.
success_conditions: []
```

After:

```yaml
# valid recipe excerpt
risk: destructive
steps:
  - description: Confirm the environment name, owner, and deletion ticket.
    requires_confirmation: true
  - description: Prepare the deletion command for human review.
    guidance: Stop before deleting anything.
success_conditions:
  - The confirmed environment is removed.
  - The deletion ticket records the operator and timestamp.
failure_patterns:
  - pattern: owner is unknown
    meaning: The environment may still be in use.
    recovery: Stop and ask the platform owner to confirm ownership.
policy:
  requires_confirmation: true
  allowed_modes:
    - confirm
```

### Add Success And Failure Criteria

Before:

```yaml
# partial snippet
steps:
  - description: Save the CMS draft.
```

After:

```yaml
# valid recipe excerpt
steps:
  - description: Save the CMS article as a draft.
    guidance: Do not publish.
success_conditions:
  - The CMS shows a saved draft confirmation.
  - The article remains unpublished.
failure_patterns:
  - pattern: publish is the only visible primary action
    meaning: Draft saving may be unavailable in the current workflow state.
    recovery: Stop and ask an editor whether to continue.
```

## Review Checklist

Full valid before/after examples are available in `docs/examples/quality-before-placeholder.yml` and `docs/examples/quality-after-placeholder.yml`.

Before adding a recipe:

- Replace concrete sensitive values with placeholders and inputs.
- Use `guidance` for prose and `suggested_command` only for non-executed command examples.
- Add success conditions that can be checked without guessing.
- Add failure patterns with meaning and recovery guidance.
- Set risk and allowed modes deliberately.
- Add confirmation points for high-impact operations.
- Run `opmem validate <recipe-file>`.
