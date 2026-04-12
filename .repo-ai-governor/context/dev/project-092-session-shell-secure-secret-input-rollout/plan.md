# project-092-session-shell-secure-secret-input-rollout 计划

- Status: active
- Date: 2026-04-12
- Stage Mapping: session-shell secure secret input rollout
- Phase Mapping: secure route parsing / secure local capture / redacted mutation handoff
- Upstream:
  - `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/plan.md`
  - `.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/tasks/DA-804-session-shell-secure-secret-input-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. 目标

1. 将 Phase A formal solution 推进为真实实现：让 session shell 可以对 explicit `/secret set <keyName>` 执行 secure local capture。
2. 在实现层补齐 secure route parsing、pre-commit extra-token rejection、本地隐藏输入状态机、redacted mutation handoff 与错误/取消 redaction。
3. 保持当前 formal scope 不扩张到 `session.main` secure-input outcome、desktop secure dialog 或 VS Code secure prompt。

## 2. Sprint 细化

## 2.1 sprint-001-secure-local-capture-and-redacted-secret-mutation

- Status: active
- Sprint Goal: 完成 explicit `/secret set <keyName>` secure route、secure local capture 与 redacted local mutation handoff 的 Phase A 实现闭环。
- Task Package: `TK-806`、`TK-807`、`TK-808`、`TK-809`
- Immediate Execution Lane: `TK-806 -> TK-807 -> TK-808 -> TK-809`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-806 | sprint-001 | implement secure route parsing and pre-commit extra-token rejection for `/secret set` | shell/routing | promotion handoff | completed |
| TK-807 | sprint-001 | add secure local capture mode and redacted presenter semantics | shell/input | TK-806 | completed |
| TK-808 | sprint-001 | wire secure secret mutation seam and fallback/error guidance | secret/runtime | TK-807 | planned |
| TK-809 | sprint-001 | sprint-001 exit acceptance and project completion assessment | closeout/handoff | TK-806、TK-807、TK-808 | planned |

## 4. 依赖产物策略

1. 本项目只承接当前 active solution 的 Phase A，实现时不得偷偷扩 scope 到 Phase B/C。
2. secure route parsing 与 pre-commit rejection 必须优先完成，否则后续 capture / redaction 仍有 presenter leakage 风险。
3. transcript、preview、error redaction 需要与 secure capture 一起验证，而不是作为事后 polish。
4. 当前拆解已将实现入口冻结到 `session-slash-command-registry.ts`、`session-shell-ink-controller.ts`、`session-shell-runner.ts`、`cli-session-shell.constant.ts`、`cli-session-shell.interface.ts`、`session-shell-entrypoint-runtime.ts` 与 secret runtime/test surfaces，避免 scope 在执行中继续漂移。

## 5. DoD（project-092）

1. explicit `/secret set <keyName>` 在 session shell 中可进入 secure local capture。
2. typed / pasted extra-token rejection 在 presenter-state commit 之前生效。
3. raw secret 不进入 composer/slash/preview/transcript/error payload。
4. Phase A 实现完成后再评估是否需要单独方案承接 Phase B/C。

## 6. 里程碑记录

1. 2026-04-12：基于 `technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff` promotion cutover 创建 `project-092`，作为新的 planned follow-up stream。
2. 2026-04-12：已将 `sprint-001` 与 `TK-806 ~ TK-809` 全量拆解写入 project / sprint / task surface，待后续窗口激活。
3. 2026-04-12：已激活 `project-092 / sprint-001` 作为新的 primary execution surface，并将 `TK-806` 冻结为第一条实现任务，后续执行顺序固定为 `TK-806 -> TK-807 -> TK-808 -> TK-809`。
