# Decisions

Use this file for durable decisions that future Codex sessions should respect.

## Template

### YYYY-MM-DD: Decision Title

- Decision:
- Context:
- Alternatives considered:
- Rationale:
- Consequences:

## Decisions

### 2026-05-05: Keep MVP Non-Executing

- Decision: Operation Memory recipes are guidance and validation artifacts, not automation scripts.
- Context: The project intentionally avoids Playwright, shell execution, MCP server behavior, embeddings, and automatic log collection in the MVP.
- Alternatives considered: Adding adapters or audit runtime behavior early.
- Rationale: The safety model depends on separating procedural memory from execution.
- Consequences: New features should preserve non-executing semantics unless a later milestone explicitly changes the scope.
