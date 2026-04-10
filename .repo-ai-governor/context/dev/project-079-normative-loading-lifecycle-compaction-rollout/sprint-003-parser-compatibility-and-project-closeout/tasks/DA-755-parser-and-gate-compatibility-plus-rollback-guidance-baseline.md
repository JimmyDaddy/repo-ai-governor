# DA-755 parser and gate compatibility plus rollback guidance baseline

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-755`
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-003-parser-compatibility-and-project-closeout`

## 1. Summary

1. sprint-003 已确认 archive manifest sidecar 的存在不会破坏 root manifest parser、manifest gate runner 与 archive integrity gate 的 bootstrap truth 语义。
2. `check-normative-loading-manifest-archive` 与 compaction apply 现在都会把 `root_manifest_path` 锚定回 canonical bootstrap path，并在比较前归一化 realpath，避免 macOS `/var` 与 `/private/var` 别名或 external cwd 让绝对路径 CLI 调用产生误报。
3. rollback guidance 已固定为正式治理说明：先 `dry-run`，必要时才启用临时 env 开关，再执行同窗口 root/archive write-back 与 post-rollback gate rerun。

## 2. Compatibility Evidence

1. root parser compatibility：
   - archive sidecar 存在时，root manifest 仍可单独通过 `check-normative-loading-manifest.js --mode block`。
2. archive integrity coverage：
   - 已新增回归场景，覆盖 archive sidecar + absolute CLI path、external-cwd archive check、external-cwd compaction apply、missing `deprecated_at`、root/archive overlap 与 archive status purity。
3. block-mode runner compatibility：
   - `run-normative-loading-manifest-gate.js` 继续同时覆盖 root manifest baseline 与 archive integrity audit，且无需引入 multi-manifest bootstrap cutover。

## 3. Rollback Playbook Delta

1. operator 入口固定为 `node ./scripts/governance/compact-normative-loading-manifest.js --dry-run`。
2. 临时放宽 gate 只允许应急使用 `NORMATIVE_LOADING_GATE_ROLLBACK=1` 或 `NORMATIVE_LOADING_GATE_FORCE_MODE=warn`。
3. rollback 本体保持简单：把目标 entry 从 archive manifest 回写 root manifest，并在同一窗口刷新两个 manifest 的 `generated_at`。
4. rollback write-back 后必须立即重跑：
   - `node ./scripts/governance/run-normative-loading-manifest-gate.js`
   - `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`
5. closeout 前必须恢复默认 `block` 模式，避免 rollback 开关泄漏到常态执行面。

## 4. Verification Evidence

1. `pnpm run build`（通过）
2. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
5. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
