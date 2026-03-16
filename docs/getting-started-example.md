# Getting Started Example

- Date: 2026-03-14
- Audience: users who want a fuller example than the Quick Start

## Goal

提供一条可复制的最小治理闭环示例，覆盖从初始化到报告输出的关键命令。

## Recommended Flow

### 1. Bootstrap

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-example.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"

$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --adapter github-copilot \
  --format json
```

### 2. Validate

```bash
$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json
```

### 3. Plan

```bash
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement

Build a repository governance MVP validation flow.

Acceptance:
- Generate planning artifacts.
- Produce task records.
- Support review and report rendering.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance MVP validation" \
  --format json
```

### 4. Check

```bash
$CLI check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --write-report \
  --format json
```

### 5. Review And Verify

```bash
mkdir -p "$TMP_DIR/src"
cat > "$TMP_DIR/src/demo.js" <<'EOF'
export function demo() {
  // TODO: refine
  return 1;
}
EOF

$CLI review \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --path src/demo.js \
  --format json

$CLI review-verify \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --source docs/demo/sprint-001/code-review/review_src-demo-js.md \
  --format json
```

### 6. Render A Final Report

```bash
$CLI report \
  --cwd "$TMP_DIR" \
  --source .repo-ai-governor/reports/latest.json \
  --format markdown \
  --dry-run
```

## Related Assets

1. [Quick Start](/Users/jimmydaddy/study/repo-ai-governor/docs/quick-start.md)
2. [MVP Acceptance Kit](/Users/jimmydaddy/study/repo-ai-governor/examples/mvp-acceptance/README.md)
3. [Codex Example](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/codex/README.md)
4. [GitHub Copilot Example](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/github-copilot/README.md)
5. [Claude Code Example](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/claude-code/README.md)
