#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
CLI=("$NODE_BIN" "$ROOT_DIR/bin/repo-ai-governor.js")

WORKSPACE="${1:-$(mktemp -d "${TMPDIR:-/tmp}/repo-ai-governor-acceptance.XXXXXX")}"
PROJECT="${REPO_AI_GOVERNOR_ACCEPTANCE_PROJECT:-demo}"
SPRINT="${REPO_AI_GOVERNOR_ACCEPTANCE_SPRINT:-sprint-001}"
REQUEST_FILE="${REPO_AI_GOVERNOR_ACCEPTANCE_REQUEST:-$ROOT_DIR/examples/mvp-acceptance/request.md}"
RECORD_TEMPLATE="$ROOT_DIR/examples/mvp-acceptance/acceptance-record-template.md"
RECORD_OUTPUT="${REPO_AI_GOVERNOR_ACCEPTANCE_RECORD:-$WORKSPACE/acceptance-record.md}"

mkdir -p "$WORKSPACE"

"${CLI[@]}" init --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --adapter codex --format json >/dev/null
cp "$REQUEST_FILE" "$WORKSPACE/request.md"
cp "$ROOT_DIR/examples/slot-packages/official/"*.yaml "$WORKSPACE/.repo-ai-governor/slots/"

(
  cd "$ROOT_DIR"
  "$NODE_BIN" --input-type=module - "$WORKSPACE" <<'EOF'
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const workspace = process.argv[2];
const governorFile = path.join(workspace, ".repo-ai-governor", "governor.yaml");
const config = YAML.parse(fs.readFileSync(governorFile, "utf8"));
config.slots.enabled = ["official-security-review", "official-documentation-output"];
fs.writeFileSync(governorFile, YAML.stringify(config), "utf8");
EOF
)

"${CLI[@]}" plan --cwd "$WORKSPACE" --project "$PROJECT" --sprint "$SPRINT" --input "$WORKSPACE/request.md" --title "Governance acceptance flow" --format json >/dev/null

mkdir -p "$WORKSPACE/src/commands" "$WORKSPACE/test/commands"
printf 'export function sample() {\n  return 1;\n}\n' > "$WORKSPACE/src/commands/sample.js"
printf 'export default true;\n' > "$WORKSPACE/test/commands/sample.test.js"

REPO_AI_GOVERNOR_CWD="$WORKSPACE" \
REPO_AI_GOVERNOR_PROJECT="$PROJECT" \
REPO_AI_GOVERNOR_SPRINT="$SPRINT" \
"$ROOT_DIR/scripts/ci/run-governance-check.sh" >/dev/null

REVIEW_JSON="$(
  REPO_AI_GOVERNOR_CWD="$WORKSPACE" \
  REPO_AI_GOVERNOR_PROJECT="$PROJECT" \
  REPO_AI_GOVERNOR_SPRINT="$SPRINT" \
  REPO_AI_GOVERNOR_REVIEW_PATH="src/commands/sample.js" \
  "$ROOT_DIR/scripts/ci/run-governance-review.sh"
)"

REVIEW_FILE="$(
  printf '%s' "$REVIEW_JSON" | "$NODE_BIN" --input-type=module -e '
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(String(chunk)));
    process.stdin.on("end", () => {
      const payload = JSON.parse(chunks.join(""));
      process.stdout.write(payload.reviewFile);
    });
  '
)"

VERIFY_JSON="$(
  REPO_AI_GOVERNOR_CWD="$WORKSPACE" \
  REPO_AI_GOVERNOR_PROJECT="$PROJECT" \
  REPO_AI_GOVERNOR_SPRINT="$SPRINT" \
  REPO_AI_GOVERNOR_REVIEW_SOURCE="$REVIEW_FILE" \
  "$ROOT_DIR/scripts/ci/run-governance-review-verify.sh"
)"

VERIFY_FILE="$(
  printf '%s' "$VERIFY_JSON" | "$NODE_BIN" --input-type=module -e '
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(String(chunk)));
    process.stdin.on("end", () => {
      const payload = JSON.parse(chunks.join(""));
      process.stdout.write(payload.outputFile);
    });
  '
)"

RESOLVE_JSON="$(
  REPO_AI_GOVERNOR_CWD="$WORKSPACE" \
  REPO_AI_GOVERNOR_PROJECT="$PROJECT" \
  REPO_AI_GOVERNOR_SPRINT="$SPRINT" \
  REPO_AI_GOVERNOR_REVIEW_SOURCE="$VERIFY_FILE" \
  "$ROOT_DIR/scripts/ci/run-governance-review-verify.sh"
)"

RESOLVED_FILE="$(
  printf '%s' "$RESOLVE_JSON" | "$NODE_BIN" --input-type=module -e '
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(String(chunk)));
    process.stdin.on("end", () => {
      const payload = JSON.parse(chunks.join(""));
      process.stdout.write(payload.outputFile);
    });
  '
)"

REPO_AI_GOVERNOR_CWD="$WORKSPACE" \
REPO_AI_GOVERNOR_REPORT_SOURCE=".repo-ai-governor/reports/latest.json" \
REPO_AI_GOVERNOR_REPORT_OUT=".repo-ai-governor/reports/acceptance-latest.md" \
"$ROOT_DIR/scripts/ci/render-governance-report.sh" >/dev/null

cp "$RECORD_TEMPLATE" "$RECORD_OUTPUT"
{
  printf '\n## Execution Result\n\n'
  printf -- '- Workspace: `%s`\n' "$WORKSPACE"
  printf -- '- Review file: `%s`\n' "$REVIEW_FILE"
  printf -- '- Verified file: `%s`\n' "$VERIFY_FILE"
  printf -- '- Resolved file: `%s`\n' "$RESOLVED_FILE"
  printf -- '- Report file: `%s`\n' ".repo-ai-governor/reports/acceptance-latest.md"
  printf -- '- Enabled slot examples: `%s`\n' "official-security-review, official-documentation-output"
} >> "$RECORD_OUTPUT"

printf '%s\n' "$WORKSPACE"
