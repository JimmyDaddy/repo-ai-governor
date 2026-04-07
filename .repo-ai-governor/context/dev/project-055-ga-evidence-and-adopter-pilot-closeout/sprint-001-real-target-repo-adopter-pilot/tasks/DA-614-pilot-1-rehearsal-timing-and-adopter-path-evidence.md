# DA-614 pilot-1 rehearsal timing and adopter-path evidence

- Status: completed
- Date: 2026-04-07
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Task: `TK-614`

## 1. Summary

1. `playground` pilot-1 已按冻结 rubric 完成 `pnpm install -> init -> doctor -> check -> verify --adapters -> run --dry-run --trace` 全链路 rehearsal。
2. 全部 6 条命令成功，总耗时 `50473ms`。
3. `init` 继续复用 tool-managed workspace：`/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor`。

## 2. Evidence Snapshot

1. `pnpm install`
   - pass
   - `273ms`
2. `pnpm exec repo-ai-governor init --output json`
   - pass
   - `1156ms`
   - workspace mode=`tool_managed`
3. `pnpm exec repo-ai-governor doctor --output json`
   - pass with `warn=5`
   - `428ms`
4. `pnpm exec repo-ai-governor check --output json`
   - pass with `warn=4`
   - `413ms`
5. `pnpm exec repo-ai-governor verify --adapters --output json`
   - pass with `adapters_status=warn`
   - `15049ms`
   - `required_role_failures=0`
   - `degraded_roles=1`
   - `fallback_roles=1`
   - diagnostics: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/diagnostics/verify/verify-1775534979004.json`
6. `pnpm exec repo-ai-governor run --dry-run --trace --output json`
   - pass
   - `33154ms`
   - `execution_id=cli-run-1775534994155`
   - `runtime_status=succeeded`
   - trace: `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/diagnostics/trace/cli-run-1775534994155.trace.json`

## 3. Findings

1. `doctor` 与 `check` 的 warning 仍是 external-adopter baseline：`baseline_docs missing=5/5`、`script_not_found`，不构成本轮 blocker。
2. `verify --adapters` 的唯一 degrade/fallback 来自 `reviewer` 路由在当前环境下从 `claude-code` 回退到 `codex`；没有 required-role hard failure，因此本轮仍满足 acceptance rubric。
3. `run --dry-run --trace` 已保留 report/replay/trace 证据，证明 adopter-path 的默认 runtime 链路在外部仓库可回放。

## 4. Output Paths

1. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
2. `.tmp/project-055-sprint-001-pilot-1/`
