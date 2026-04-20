# ADR: VS Code Plugin Direct API Key And Secret-Backed Provider Onboarding

- Status: active
- Date: 2026-04-20
- Module: `runtime.governance-clients`

## 1. Context

当前 `runtime.governance-clients` 已 formalize `VS Code primary workbench` 与 `config / secret` command family，但 provider onboarding 这一条最高频的人类路径仍停留在不完整状态：

1. VS Code 插件当前 connect flow 仍然提示用户填写 `credentialEnvVar`，把首轮接入建立在 env-var-first 心智之上。
2. 插件虽然已经拥有 `setManagedSecret()` 与 secret-backed `credentialRef` 相关 runtime seam，却还没有把它们收敛成默认的人类主路径。
3. `runtime.agent-projection` 已明确冻结 `connect / doctor / verify` 的 analyze-first / read-only boundary；如果把 direct API key entry 偷渡进这些命令，就会破坏现有 owner split。
4. 用户希望在 VS Code 内像其他 AI 插件一样直接选择 provider、填写 model/endpoint、粘贴 API key，而不是先理解环境变量与 CLI authoring 细节。

## 2. Decision

正式采用以下收口决策：

1. VS Code 插件的人类默认 provider onboarding 路径固定为 host-native direct API key entry，而不是 env-var-first authoring。
2. 直接输入 API key 必须通过显式 provider-onboarding mutation seam 或等价 host-facing command 完成；`connect / doctor / verify` 继续保持 analyze-first / read-only onboarding surface，不承担静默 secret/config 写入责任。
3. 持久化边界固定为：
   - raw API key -> Governor managed secret backend
   - durable config -> user-local non-secret provider defaults + `credentialRef`
   - extension-local secret storage -> optional supplemental platform capability，不是 canonical secret owner
4. canonical owner split 固定为：
   - `runtime.governance-clients`：host-facing onboarding UX、secure prompt、CTA mapping、receipt/backlink 呈现
   - `runtime.agent-projection`：`transport / provider / vendorBinding` normalization、`verification_status / next_action(s)` canonical truth
5. 默认 selector strategy 固定为 `secret://<provider>/api-key`；若后续 runtime 需要更细粒度 selector，必须走显式 canonical truth 变更。
6. follow-up implementation、evidence 与 public wording refresh 由 `project-116-vscode-direct-provider-onboarding-rollout` 承接；本 ADR 不谎报代码或 docs 已全部切换完成。

## 3. Rationale

1. 把 direct API key onboarding 固定为 host-native primary path，才能兑现 `VS Code primary workbench` 的人类使用体验，而不是继续把插件当作 CLI 参数提示器。
2. 将 mutation seam 与 `connect / doctor / verify` 分层，可以保持既有 analyze-first runtime truth 不被 GUI convenience 路径侵蚀。
3. 继续让 managed secret backend 持有 canonical secret，可以同时满足 direct-entry UX 与 secret-backed security boundary，而不必把明文 key 写进配置文件或扩展本地状态。
4. 明确 owner split 后，host-facing UX 可以快速迭代，但不会无意中改写 `runtime.agent-projection` 已 formalize 的 canonical onboarding/readiness contract。

## 4. Consequences

1. `runtime.governance-clients` 需要新增专门的 provider-onboarding contract，而不是继续把 direct key entry 混在 `local config / secret` command contract 或 VS Code workbench contract 的边角补充里。
2. VS Code 插件后续实现必须以 service-owned `snapshot / apply / receipt` facade 为主，而不是长期暴露散落的 `setManagedSecret` 与 raw config key authoring 组合。
3. `apps/vscode-extension/README.md`、`docs/local-adoption-playbook*.md` 与 support docs 只有在真实 runtime/evidence 落地后才允许改口为 direct-key-first；本 ADR 本身不提前宣称支持 truth 已切换。
4. CLI / CI / headless 继续保留 `credentialEnvVar` compatibility path；差异只发生在 plugin-primary human path，不等于废弃 CLI。

## 5. Follow-Up

1. `project-116` sprint-001：冻结 provider-onboarding facade、selector defaults 与 owner split
2. `project-116` sprint-002：实现插件内 direct API key entry、managed secret write 与 explicit mutation receipt
3. `project-116` sprint-003：收口 overview/status/doctor CTA、`Update API Key` / `Reconnect Provider` lifecycle 与 degraded guidance
4. `project-116` sprint-004：补齐 built-source / local-VSIX evidence、receipt/backlink coverage 与 docs refresh readiness
5. `project-116` sprint-005：完成 zero-env-var clean-room rehearsal、support truth parity 复核与 rollout closeout
