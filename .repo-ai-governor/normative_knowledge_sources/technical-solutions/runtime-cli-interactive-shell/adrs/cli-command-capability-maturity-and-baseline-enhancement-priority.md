# CLI Command Capability Maturity And Baseline Enhancement Priority ADR

- Status: active
- Date: 2026-04-04
- Module ID: `runtime.cli-interactive-shell`
- ADR ID: `adr.runtime.cli-interactive-shell.command-capability-maturity-priority.v1`

## 1. Context

`repo-ai-governor` CLI 当前已经不是“所有命令同一成熟度”的状态。

尤其在 `runtime.cli-interactive-shell` 所覆盖的命令 surface 上，已经同时存在：

1. 已接入产品面、但仍偏 artifact-first / analyze-first 的 thin-baseline command
2. 已经具备真实执行、验证或迁移链路的 relative-mature baseline command

如果没有一份正式 ADR 固化这种 maturity layering，后续项目很容易出现三种漂移：

1. 只记得某些命令“还薄”，却忘了 companion contract draft 在哪里
2. 把“ROI 排序”与“主线战略补强顺序”混成一张表
3. 误把这类优先级分析当成 command runtime truth，而不是 planning input

## 2. Decision

`runtime.cli-interactive-shell` 正式接受以下 planning-side formal direction：

1. CLI command maturity 应被视为正式治理输入，而不是非结构化备注。
2. 当前 thin-baseline command set 固定为：
   - `plan`
   - `review / review-verify`
   - `upgrade`
3. `review / review-verify` 必须被视为同一治理闭环程序，不按两个彼此独立的散点命令建模。
4. 当前 relative-mature baseline command set 包括：
   - `init`
   - `run`
   - `connect`
   - `doctor`
   - `check`
   - `verify`
   - `workflow`
   - `workspace`
5. 后续立项必须同时保留两种排序视角：
   - `产品价值 / 实现成本（ROI）`
   - `baseline 能力补强顺序（战略闭环）`
6. 当前正式接受的优先级判断为：
   - ROI 优先：`upgrade -> plan -> review / review-verify -> init -> run`
   - 战略闭环优先：`review / review-verify -> upgrade -> plan -> run -> init`
7. thin-baseline command 的正式联读输入固定为：
   - `plan` -> `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
   - `review / review-verify` -> `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
   - `upgrade` -> `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`

## 3. Why

### 3.1 需要把“命令成熟度不均匀”正式化

继续把所有 CLI command 都叫做 baseline，会掩盖真实差异：

1. `upgrade` 已有 analyze/candidate/rollback snapshot，离 controlled apply 只差后一段
2. `plan` 已有 session.main 路由与 snapshot artifact，离真实 task breakdown 更近
3. `review / review-verify` 虽然主线价值最高，但缺口跨 reviewer findings、verify decision、lifecycle artifact 与 ledger backfill

这类差异一旦不被正式记录，后续 roadmap 就会失真。

### 3.2 需要把 companion contract 与 maturity analysis 绑定

成熟度分析回答的是“为什么补、先补谁”。

command-specific draft 回答的是“具体 contract 边界是什么”。

两者如果不强制联读，项目很容易发生两种相反漂移：

1. 只看分析文，立项时 scope 太虚
2. 只看专项 contract，立项时忽略产品优先级与闭环价值

### 3.3 这是一份 planning ADR，不是 command truth contract

本 ADR formalize 的是：

1. 优先级 lens
2. maturity layering
3. linked-input policy

它不直接替代：

1. `contract.cli.interactive-shell.v1`
2. `contract.cli.session-shell.v1`
3. `plan / review / upgrade` 的后续 command contract

## 4. Consequences

### 4.1 允许的事情

1. 后续为 `plan / review / review-verify / upgrade` 起项目时，默认把本 ADR 与对应 companion draft 一起列入 Depends On。
2. 在 module overview 或 delivery handoff 中，把“当前最值得补强的 thin-baseline command set”作为正式 planning input 回链。
3. 将 `review / review-verify` 继续视为同一治理闭环，而不是拆成两个互不相关的 roadmap 条目。

### 4.2 不允许的事情

1. 把本 ADR 的优先级表直接当成 runtime policy 或 shell-local routing truth。
2. 因为 `upgrade` 在 ROI 上靠前，就忽略 `review / review-verify` 在战略闭环上的第一优先级。
3. 把 companion draft 误报为已经 active formal contract。

## 5. Rollout Truth

本 ADR 只 formalize planning direction。

它不声明以下内容已经自动完成：

1. `plan` 已具备真实 task breakdown 与 ledger commit
2. `review / review-verify` 已具备完整 review lifecycle closure
3. `upgrade` 已具备 controlled apply / verify / rollback

这些 follow-up 仍需由后续 implementation stream 承接。
