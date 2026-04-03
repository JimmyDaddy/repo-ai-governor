# Code Review: provider session reuse and backend conversation continuity technical solution

- Status: resolved
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `draft technical solution review`
- Review Type: technical solution draft review
- Target: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
8. `packages/core-session/src/shared-session-manager.ts`
9. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
10. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
11. `packages/adapters/codex/src/codex-agent-adapter.ts`
12. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
13. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`

## 2. Findings
### 2.1 [P1] `providerContinuations` 的写回模型会覆盖兄弟 lane slot
- 位置: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:215-243`, `:327-347`
- 问题描述: 方案要求把 continuation state 作为 `providerContinuations` 这个 session-scoped map 持久化到 shared session context，并在每轮结束后“写回 refreshed slot”。但当前 `SharedSessionManager.updateContext()` 只有顶层浅合并：`context: { ...session.context, ...options.contextPatch }`，不会对嵌套 map 做 field-level merge（`packages/core-session/src/shared-session-manager.ts:175-189`）。与此同时，现有 runtime 对 shared session 的更新也只是补平铺 key（`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:394-400`），并没有 slot-aware 的 compare-and-merge 入口。
- 影响: 一旦某个 lane 以 `{ providerContinuations: { [laneKey]: slot } }` 形式回写，极易把同 session 下其他 lane 已有的 continuation slots 整体覆盖掉，直接破坏方案自己强调的“同 session 多 lane 隔离复用”目标。这个风险不是实现细节，而是当前仓库既有 session mutation contract 与方案设计之间的硬冲突。
- 建议: 在正式化前先补齐 slot-aware 的 session mutation contract，例如“按 laneKey upsert/clear continuation slot”的专用 API，或者明确要求 runtime 先读全量 map 再在 lock 内做深合并；否则 6.2 和 6.5 的持久化路径不具备安全落地条件。

### 2.2 [P1] opaque continuation handle 的持久化缺少敏感信息边界
- 位置: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:190-243`
- 问题描述: 方案把 `ProviderContinuationHandle` 定义为 adapter-owned opaque contract，其中 `value: string`、`metadata?: Record<string, unknown>` 完全不设限；随后又要求把包含 `handle` 的 slot 原样落入 shared session context。当前 draft 只约束“runtime 不解析语义”“不能直接当 transcript 输出”，但没有明确禁止 `value/metadata` 携带 provider secret、bearer-like token、可重放凭据，或要求走 secret-store indirection / redaction。
- 影响: 这会把 provider-specific continuation token 直接带入 Governor 的 shared session 持久化面，与现有 runtime-agent-projection 对 secret store / provider-owned config 的 analyze-first、read-only 边界相冲突（`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md:22-31`, `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md:15-23`）。如果后续某个 adapter 把敏感 continuation 凭据塞进 handle，本方案会在没有额外防线的情况下把它纳入共享会话事实源。
- 建议: 在 contract 层明确 continuation handle 只能保存非 secret 的 provider reference；若 provider 只提供敏感 continuation token，则必须落入 secret store，由 shared session 仅持有可审计的引用 ID 和最小兼容性元数据。至少需要给 `value` / `metadata` 加上禁止项、脱敏要求和审计展示规则。

### 2.3 [P2] 新 continuation 协议的 formal contract owner 写得不一致
- 位置: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:6-9`, `:278-325`, `:533`
- 问题描述: draft front matter 把目标模块列成 `runtime.orchestration`、`runtime.cli-interactive-shell`、`runtime.agent-projection`，正文 6.4 又明确要修改 `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts` 的 invoke/stream contract；但结论部分却说“推荐优先落入 `runtime.orchestration` 的 exported contract change”。这与现有模块注册表不一致：`runtime.orchestration` 当前只导出 `contract.runtime.graph-execution.v1`（`.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:325-367`, `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:38-40`），而 adapter-facing / transport/provider-binding seam 明确归 `runtime.agent-projection` 所有（`.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml:381-417`, `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md:15-21`）。
- 影响: 如果 formalization 时不先确定 owner，后续会卡在“究竟是扩 `graph-execution` contract，还是新增/扩展 agent-projection contract”这个治理问题上，模块注册表、overview、contract 文档和实现包的 promotion 路径都会失配。
- 建议: 在 draft 中先明确 continuation protocol 的 owner 和分层切口。比较合理的做法是：adapter request/result 字段与 provider capability truth 归 `runtime.agent-projection`，而 orchestration 只消费该 contract 并定义 laneKey / session truth / policy gate 的运行时规则；如果希望 orchestration 直接导出 continuation 语义，也需要同步说明为什么要扩展它当前唯一导出的 `graph-execution` contract。

### 2.4 [P2] continuation 生命周期的共享审计/投影契约仍然空缺
- 位置: `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md:320-325`, `:429-440`
- 问题描述: draft 反复强调 continuation 需要被 orchestration、resume、desktop consumer、tests 一起看见，并在 invalid handle 时“记审计”，但当前方案真正定义出来的只有 request/result 字段和 slot 持久化，没有定义 `created/reused/refreshed/cleared/unsupported` 这些状态如何进入 shared session truth、turn audit 或 presenter-safe view model。
- 影响: 仅靠“当前 slot 是否存在”不足以支撑回放、诊断和 UI/测试消费。例如 slot 被清掉后，CLI/Desktop 无法区分是 surface fallback、provider invalidation 还是 policy boundary 变化导致的清理；这会削弱顶层方案要求的结构化审计与恢复能力（`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md:23-34`），也不利于 `runtime.orchestration` 已强调的 shared-session truth 投影方向（`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md:51-55`）。
- 建议: 在正式化前至少补一类结构化产物的归宿说明，例如 turn-level continuation audit record、shared-session projection metadata，或 presenter-safe continuation summary。否则“desktop/tests 一起看见”仍停留在口号层。

## 3. Notes
1. 当前实现证据显示 Codex remote 已经能回收 `threadId`，但 Claude remote 仍以 fresh message 数组发起请求，GitHub Copilot 也没有稳定 continuation token contract，因此 draft 里“先统一 contract、再按 provider 渐进接入”的总体方向是合理的。
2. 这份 draft 目前尚未出现在 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml` 或 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml` 中。作为 draft 这不是阻断问题，但若后续进入 formal promotion，需要一并补齐注册表落点。

## 4. Verification
1. 基于文档与现有实现进行静态审查，未对业务代码做修改。
2. 本次没有运行 `pnpm run build`、`pnpm run check` 或测试命令，因为目标是技术方案评审而非实现交付验收。

## 复核结论（2026-04-04）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] providerContinuations 的写回模型会覆盖兄弟 lane slot`
   - 判定：**认可**
   - 证据：当前 draft 只定义了 session-scoped `providerContinuations` map 和“写回 refreshed slot”的结果语义，但没有补充 slot-aware mutation contract；而现有 [shared-session-manager.ts](/Users/jimmydaddy/study/ai-governor/packages/core-session/src/shared-session-manager.ts#L175) 的 `updateContext()` 仅做顶层浅合并，现有 [local-orchestration-service-session-runtime.ts](/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts#L394) 也只回写平铺 key。按当前文案推进实现，确实会留下兄弟 lane slot 被整体覆盖的风险。
   - 处理：正式化前需要把“slot-aware upsert/clear”明确成 contract 或 persistence helper，而不是把它留给实现阶段自行补脑。
2. `2.2 [P1] opaque continuation handle 的持久化缺少敏感信息边界`
   - 判定：**认可**
   - 证据：当前 draft 虽然补了 enum/constants 和 `sessionId` 边界，但仍允许 `ProviderContinuationHandle.value` 与 `metadata` 作为 opaque 数据原样持久化到 shared session context；文中没有写明 secret prohibition、indirection、redaction 或 audit-safe projection 规则。这和 [runtime-agent-projection/module-overview.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md#L15) 里对 secret store / provider-owned config 的 analyze-first、read-only 边界不够对齐。
   - 处理：建议把“shared session 只能保存 non-secret reference；若 provider 只给敏感 continuation token，则改存 secret-store reference id”补进 draft 正文。
3. `2.3 [P2] 新 continuation 协议的 formal contract owner 写得不一致`
   - 判定：**认可**
   - 证据：当前 draft front matter 同时列了 `runtime.orchestration` 与 `runtime.agent-projection`，正文 6.4 明确要扩 `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`，而结论段仍写“推荐优先落入 runtime.orchestration 的 exported contract change”。但现有 [technical-solution-module-registry.yaml](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml#L325) 显示 `runtime.orchestration` 当前导出的是 `graph-execution` contract，而 provider binding / transport-aware projection seam 更明确地归 [runtime-agent-projection/module-overview.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md#L15) 所有。
   - 处理：更合理的切口是把 adapter-facing continuation request/result owner 明确放到 `runtime.agent-projection`，由 `runtime.orchestration` 定义 laneKey、session truth 与 policy/invalidation 运行时规则。
4. `2.4 [P2] continuation 生命周期的共享审计/投影契约仍然空缺`
   - 判定：**认可**
   - 证据：draft 已要求 continuation 状态需要被 orchestration、resume、desktop consumer、tests 一起看见，也提到 invalid handle 要“记审计”，但正文没有把 `created/reused/refreshed/cleared/unsupported/invalid` 投影成哪一种 shared-session event、turn metadata 或 presenter-safe summary 定义出来。仅凭 slot 持久化，无法支持回放、诊断和 UI 区分清理原因。
   - 处理：建议在 formalization 前补一层 continuation lifecycle audit/projection contract，例如 turn-level continuation summary 或 shared-session metadata/event schema。

### 验证命令
1. `sed -n '1,260p' .repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-001-capability-catalog-and-turn-outcome-foundation/review/code_review_provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
2. `sed -n '1,260p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
3. `nl -ba packages/core-session/src/shared-session-manager.ts | sed -n '165,195p'`（通过）
4. `nl -ba packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts | sed -n '390,405p'`（通过）
5. `sed -n '320,430p' .repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`（通过）

## 修复执行记录（2026-04-04）

1. `2.1 [P1] providerContinuations 的写回模型会覆盖兄弟 lane slot`：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：`sed -n '188,380p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
   - 说明：已把 `providerContinuations` 的正式落盘改成“slot-aware mutation seam”要求，并补充 `ProviderContinuationSlotMutationRequest` 与 lock 内 `upsert/clear` 的最低约束，避免继续误导为直接用 `updateContext()` 写整张 map。
2. `2.2 [P1] opaque continuation handle 的持久化缺少敏感信息边界`：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：`sed -n '188,260p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
   - 说明：已把 handle 改写为 `referenceValue` 语义，并明确只允许 non-secret inline reference；对敏感 continuation token 改成“保持 unsupported，等待 secret-store reference seam formalized”的边界。
3. `2.3 [P2] 新 continuation 协议的 formal contract owner 写得不一致`：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：`sed -n '278,360p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
   - 说明：已把 owner 拆成 `runtime.agent-projection` 负责 adapter-facing continuation seam，`runtime.orchestration` 负责 laneKey/session lifecycle/audit projection，并同步修正结论段 formalization 路径。
4. `2.4 [P2] continuation 生命周期的共享审计/投影契约仍然空缺`：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：`sed -n '360,445p' .repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`（通过）
   - 说明：已新增 `ProviderContinuationTurnSummary` 与 turn-level shared-session/audit projection 规则，明确 `created/reused/refreshed/cleared/invalid/unsupported` 的 presenter-safe 落点。
5. docs-only closeout：已完成
   - 变更文件：`.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
   - 验证：未运行 `pnpm run build`
   - 说明：本次仅修改 draft 与 review 生命周期文件，未触及 `apps/**`、`packages/**`、`bin/**`、`test/**` 下可执行代码，因此 build not required。
