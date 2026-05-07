#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/opmem-smoke.XXXXXX")"

cleanup() {
  rm -rf "${WORK_DIR}"
}

trap cleanup EXIT

cd "${WORK_DIR}"

node "${ROOT_DIR}/dist/cli.js" init --json >/dev/null
node "${ROOT_DIR}/dist/cli.js" add "${ROOT_DIR}/examples/recipes/release-handoff.yml" --json >/dev/null
node "${ROOT_DIR}/dist/cli.js" add "${ROOT_DIR}/examples/recipes/incident-review.yml" --json >/dev/null

node "${ROOT_DIR}/dist/cli.js" list --json | grep '"release-handoff"' >/dev/null
node "${ROOT_DIR}/dist/cli.js" search "customer impact" --json | grep '"incident-review"' >/dev/null
node "${ROOT_DIR}/dist/cli.js" show release-handoff --json | grep '"risk"' >/dev/null
node "${ROOT_DIR}/dist/cli.js" validate --json | grep '"ok": true' >/dev/null

echo "Smoke check passed"
