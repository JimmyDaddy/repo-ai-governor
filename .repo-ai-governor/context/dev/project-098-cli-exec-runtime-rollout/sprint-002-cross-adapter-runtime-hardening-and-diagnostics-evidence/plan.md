# sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence 计划

- Status: planned
- Date: 2026-04-13
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint Goal: 将 shared runtime 扩展到 `Claude Code` / `GitHub Copilot`，并补齐 cross-platform diagnostics 与 evidence。

## 1. Task Package

1. `TK-825` cut claude-code onto the shared native cli_exec runtime and lifecycle observer
2. `TK-826` cut github-copilot onto the shared native cli_exec runtime and aligned cancellation semantics
3. `TK-827` harden Unix and Windows process-tree termination plus additive diagnostics evidence across adapters
4. `TK-828` sprint-002 exit acceptance and sprint-003 activation handoff

## 2. Exit Criteria

1. `Claude Code` 与 `GitHub Copilot` 已切到 shared native `cli_exec` runtime，同时保持各自 parser / route / capability truth。
2. Windows / Unix process-tree termination、shell wrapping 与 additive diagnostics evidence 已具备。
3. cross-adapter evidence 已能证明 shared runtime convergence 没有改写 canonical transport truth。

## 3. Milestones

1. 2026-04-13：作为 `project-098` 的第二阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-13：当前 sprint 必须等 `sprint-001` clean 收口后再激活，避免 adapter cutover 建在漂移的 runtime abstraction 上。
