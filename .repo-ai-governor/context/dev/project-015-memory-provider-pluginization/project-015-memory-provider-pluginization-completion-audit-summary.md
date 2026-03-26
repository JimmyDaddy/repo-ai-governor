# project-015 memory provider pluginization 完成态审计摘要

- Status: completed
- Date: 2026-03-26
- Project: `project-015-memory-provider-pluginization`
- Scope: `sprint-001` ~ `sprint-004`

## 1. 审计结论

`project-015-memory-provider-pluginization` 已达到当前定义范围内的完成态。memory provider built-in registry、optional plugin mode、shared loader / service reuse、service-host packaging 与 clean-room / release gate 已形成正式 handoff。

## 2. 审计范围

1. project / sprint / task 台账一致性与完成状态
2. `DA-159`、`DA-160`、`DA-167` ~ `DA-178` 产物链路完整性
3. memory provider registry、plugin resolution、distribution 与 shared loader/service reuse 收口情况
4. CLI、desktop host、service-backed runtime 与 service-host packaging 的 release / clean-room 证据链

## 3. 审计结果

1. 项目层状态
   - `project-015` 已具备切换为 `completed` 的交付条件。
2. sprint 层状态
   - `sprint-001`：bootstrap / rebaseline completed
   - `sprint-002`：built-in registry / loader foundation completed
   - `sprint-003`：optional plugin mode / policy hardening completed
   - `sprint-004`：shared loader / service reuse completed
3. 任务层状态
   - 最新执行记录聚合结果：`TK-159`、`TK-160`、`TK-167` ~ `TK-178` 共 `12/12 completed`。
4. 产物链路
   - `DA-159`：project-015 bootstrap 与 memory provider pluginization rebaseline
   - `DA-160`：LangGraph runtime productization gap register 与 project-016 handoff baseline
   - `DA-167`：built-in registry / descriptor contract baseline
   - `DA-168`：CLI loader cutover 与 legacy config compatibility
   - `DA-169`：distribution / release alignment for optional built-in providers
   - `DA-170`：sprint-002 exit acceptance 与 sprint-003 输入约束
   - `DA-171`：plugin allowlist / resolution contract baseline
   - `DA-172`：CLI plugin loader cutover 与 dual-input compatibility
   - `DA-173`：plugin-enabled distribution / clean-room / release gate baseline
   - `DA-174`：sprint-003 exit acceptance 与 sprint-004 输入约束
   - `DA-175`：shared loader / host surface baseline
   - `DA-176`：CLI / desktop host / service-backed runtime loader reuse cutover
   - `DA-177`：service-host packaging / clean-room / release gate expansion
   - `DA-178`：sprint-004 exit acceptance 与 project completion assessment
5. 能力收口结论
   - memory provider 不再以 CLI 全量内置依赖形式存在，built-in registry 与 optional plugin 的责任边界已清晰。
   - `provider.module` 受 allowlist / prefix / fail-closed 约束，plugin mode 已与 default distribution 分离验证。
   - CLI、desktop host 与 service-backed runtime 已共用同一条 loader / registry seam。
   - service-host / desktop 的 packaging、clean-room 与 release gate 已独立验证，不再复用 CLI-only 结果代替。

## 4. 门禁复跑

1. `pnpm -s tsc -p tsconfig.json --noEmit`：通过
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts test/desktop-entry-smoke.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`：通过
3. `node ./scripts/examples/check-desktop-entry-smoke.js`：通过
4. `node ./scripts/examples/check-desktop-entry-smoke.js --distribution-mode plugin-enabled`：通过
5. `node ./scripts/release/verify-local-distribution.js`：通过
6. `node ./scripts/release/verify-local-distribution.js --distribution-mode plugin-enabled`：通过
7. `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1 --output .tmp/release-cleanroom-sprint004-default-report.json`：通过
8. `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled --modes path --iterations 1 --output .tmp/release-cleanroom-sprint004-plugin-enabled-report.json`：通过
9. `pnpm run check`：通过

## 5. 后续 rollout 输入

1. `project-015` 已闭项；下一条 active stream 需单独显式激活，不再让已完成 sprint 占用默认执行面。
2. 若后续继续扩围 memory provider external plugin trust model、service-host daemonization 或更宽的 provider ecosystem，应新开 follow-up stream。
3. 当前正式基线要求继续保持：
   - plugin resolution fail-closed
   - service-owned `memoryProvider` composition summary
   - default / plugin-enabled / service-host clean-room 分离验证
