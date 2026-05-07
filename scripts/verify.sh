#!/usr/bin/env bash
set -euo pipefail

run_if_script_exists() {
  local script_name="$1"

  if npm run | grep -E "^[[:space:]]+${script_name}$|^[[:space:]]+${script_name}:" >/dev/null 2>&1; then
    echo "Running npm run ${script_name}"
    npm run "${script_name}"
  else
    echo "No npm script '${script_name}' detected"
  fi
}

main() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found; cannot verify this Node.js project" >&2
    return 1
  fi

  run_if_script_exists typecheck
  run_if_script_exists test
  run_if_script_exists build
  run_if_script_exists smoke

  echo "Verification script completed"
}

main "$@"
