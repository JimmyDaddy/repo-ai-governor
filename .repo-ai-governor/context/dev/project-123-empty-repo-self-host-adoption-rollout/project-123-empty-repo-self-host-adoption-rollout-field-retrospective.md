# project-123 empty-repo self-host adoption rollout field retrospective

- Status: completed
- Date: 2026-05-14
- Scope: `project-123-empty-repo-self-host-adoption-rollout`
- Evidence Base:
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1065-project-123-final-closeout-and-idle-primary-stream-handoff.md`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. Executive Summary

1. 本次 `/Users/jimmydaddy/study/deepseekian` 实地采用证明，empty-repo `self-host-complete + repo_local` 已可完成从 bootstrap 到 first dry-run 的真实 operator path，但此前对外 guidance、runtime baseline 与 readiness 叙事并不完全一致。
2. 最大的真实问题不是“命令不可用”，而是 operator 很容易在“哪些步骤是 canonical、哪些文件应纳入版本控制、哪些 warning 是 expected、哪些 blocked 是 hard stop”这些关键边界上产生误判。
3. `project-123` 已修复核心 runtime/doc truth，但这次落地也暴露出若干后续值得继续优化的方向：ignore 策略 discoverability、self-host placeholder authoring onboarding、policy gate explainability、clean-room reset ergonomics、以及 docs/support truth 的持续一致性治理。

## 2. Confirmed Field Issues

### 2.1 Missing Or Under-Specified Operator Steps

1. 旧 guidance 没有把 `connect apply --latest` 作为 self-host path 的显式必经步骤，容易让 operator 误以为 `connect` 已经完成激活。
2. 旧 guidance 没有强调 `connect apply --latest` 之后必须重新执行 `adopt verify --repo .`，导致 adapter-connected truth 没有回写到 canonical readiness summary。
3. 旧 guidance 没有把 `adopt verify` 明确为唯一 canonical readiness producer，容易与 `doctor` 或 `check` 的输出并列理解。
4. 旧 guidance 对 first dry-run 的真实前置条件描述不足，没有提前说明 self-host starter placeholders 未完成时，`execution_ready=blocked` 是 expected hard stop。

### 2.2 Wrong Or Misleading Guidance Surfaces

1. adopter-facing docs 曾把 self-host path 近似写成“`connect` 后直接 dry-run”，这与 clean-room 实证不一致。
2. `doctor` 与 `check` 在 operator 认知上曾容易被理解成“另一个 readiness verdict 入口”，而不是消费 `adopt verify` truth 的辅助面。
3. `.gitignore` recommendation 虽然已落为 opt-in artifact，但如果文档不先解释 ownership taxonomy，operator 很难理解为什么它不是自动写入，也不知道是否应该采用。
4. 部分 self-host 文案此前没有足够强调“repo_local starter surfaces 是模板起点，不是可直接 unattended execution 的完成态”。

### 2.3 Runtime And Product Gaps Exposed By Clean-Room

1. fresh self-host bootstrap 一度只播种了 starter `tasks.csv`，但没有同步 canonical `task-ledger.sqlite`，导致 `doctor --adapters` 在 first-run 就出现 fail-closed。
2. self-host first-run 虽然已能走到 policy gate，但 operator 对 `lockfile_delta` 与 `POLICY_GATE_HITL_FEEDBACK_INVALID` 的含义仍不够直观，容易误判为 onboarding failure。
3. placeholder blocking 已被正确建模到 `adopt verify`，但“下一步到底该改哪些 starter file”仍然偏诊断化，缺少更短的 authoring checklist。
4. clean-room reset 实际需要区分 adoption-managed surfaces、runtime-generated artifacts 与用户资产；如果没有明确清单，人工清理成本较高且有误删风险。

### 2.4 Governance And Delivery Process Gaps

1. public docs truth 在 clean-room evidence 完成前一度存在抢跑风险，说明 adopter-facing support surfaces 仍需要更强的 evidence-gated write-back discipline。
2. field learning 原本分散在 sprint task、review artifact、completion audit 中；如果没有单独 retrospective，后续很容易只看到“已修复”，看不到“为什么会错、以后怎么避免”。
3. fresh reviewer loop 能抓到 code/doc drift，但对于“operator 是否容易走错路径”这类 adoptability 问题，当前仍主要依赖人工总结，而不是结构化验收项。

## 3. Ignore And Cleanup Recommendations

### 3.1 Recommended Clean-Room Reset Scope

1. 应删除 `.repo-ai-governor/**`，因为这是 self-host bootstrap、runtime diagnostics、reports、replay 与 canonical workspace surfaces 的主要承载面。
2. 应删除 `.agents/**`，因为这是 host/tool sidecar asset surface，重演 clean-room 时应重新生成。
3. 应删除 `.claude/**`，因为它属于 host integration follow-up surface，而不是用户仓库既有资产。
4. 应删除 `.mcp.json`，因为它是 adoption-generated integration artifact。
5. 应删除 `AGENTS.md`，因为 self-host bootstrap 会重新播种 repo-local governor entry surface。
6. 应清理 runtime-generated diagnostics/reports/replay/sqlite sidecars，避免旧 evidence 污染新一轮 rehearsal judgement。

### 3.2 Recommended Preserve Scope

1. 应保留 `.git/`，否则不再是同一个目标仓库。
2. 应保留 `package.json` 与 `pnpm-lock.yaml`，因为它们属于 target repo 自身的包管理基线，不是 adoption-managed truth。
3. 应保留 `node_modules/`，用于降低 clean-room rehearsal 的重复安装成本；它不是 adoption truth，但可作为 harness 保留。
4. 应保留任何不在 adoption managed paths 内的用户资产，包括源码、私有脚本、业务配置与非 runtime-generated 数据。

### 3.3 Recommended Ignore Targets For Self-Host Repos

1. runtime-generated diagnostics artifacts 应作为 `.gitignore` opt-in 候选，包括 `.repo-ai-governor/context/diagnostics/**`。
2. runtime-generated reports 应作为 `.gitignore` opt-in 候选，包括 `.repo-ai-governor/context/reports/**`。
3. runtime-generated replay artifacts 应作为 `.gitignore` opt-in 候选，包括 `.repo-ai-governor/context/replay/**`。
4. runtime-generated sqlite sidecars 应作为 `.gitignore` opt-in 候选，但前提是文档先解释哪些 sqlite 是 canonical repo truth、哪些只是临时 sidecar，避免 operator 误把 canonical ledger 一并忽略。
5. `.gitignore` recommendation 仍应保持 opt-in，而不是静默改写 adopter repo；原因是 self-host repo 对 artifact retention、audit persistence 与 version-control policy 可能有不同偏好。

## 4. Missing Guidance We Should Add Or Strengthen

1. 增加一个极短的 self-host happy path 卡片，只保留 `adopt bootstrap -> connect -> connect apply --latest -> adopt verify -> doctor --adapters -> run --dry-run --trace`。
2. 在 happy path 旁边明确列出每一步的“完成语义”：
   - `connect` 只生成 candidate。
   - `connect apply --latest` 才写入 active config。
   - `adopt verify` 才刷新 canonical readiness truth。
   - `doctor --adapters` 只做 additive diagnostics。
   - `check` 是 broader governance audit，不是替代 verify 的 activation gate。
3. 增加一段“expected first-run warnings”说明，提前告诉 operator：fresh self-host `warn` 与 placeholder-related `blocked` 在 authoring 未开始前是正常现象。
4. 增加一个“如果 dry-run 停在 policy gate，不代表 bootstrap 失败”的说明，并把 `lockfile_delta` / `confirm` / `POLICY_GATE_HITL_FEEDBACK_INVALID` 解释为 execution-stage signal。
5. 增加 clean-room reset checklist，明确可删与应保留范围，避免每次都靠人工回忆。

## 5. Additional Problems Beyond The User Examples

1. 命名层面的认知负担仍偏高：`bootstrap`、`connect`、`connect apply`、`verify`、`doctor`、`check` 都合理，但对首次 adopter 来说步骤职责太接近，需要更强的“一句话职责表”。
2. self-host onboarding 仍偏“懂治理的人友好”，对只想先跑通一次的 operator 来说，placeholder authoring 与 readiness semantics 的学习曲线偏陡。
3. current diagnostics 仍偏 artifact-first，如果 CLI 在终端直接给出更短的 next-action summary，operator 会更快知道下一步做什么。
4. clean-room validation 现在已经能证明 truth，但还缺少一个可重复调用的“一键 rehearsal/reset harness”，导致 maintainer 重演成本仍然偏高。
5. field feedback 目前主要通过人工复盘回写；如果未来 adoption path 再演化，仍可能重复出现“support matrix 已更新，但 playbook 口径没完全同步”的问题。

## 6. Optimization Recommendations

### 6.1 Product And CLI

1. 为 self-host 增加更明确的 first-run summary，在 `adopt bootstrap` 完成后直接提示后续 canonical path，而不是依赖 operator 自己拼接命令序列。
2. 在 `connect` 结束时更明确地提示“candidate only, run `connect apply --latest` next”。
3. 在 `adopt verify` 的 blocked self-host placeholder 场景下，输出更短的 authoring next-actions summary，并尽量定位到 starter surfaces。
4. 为 policy-gated dry-run 增加更直观的 operator hint，降低把 HITL confirm 理解为 error 的概率。

### 6.2 Docs And Support Truth

1. 把 self-host happy path 压缩为单屏可读的 canonical snippet，并在 README 与 playbook 中都保持同一顺序。
2. 在 support matrix 的 self-host notes 中继续坚持“supported path + explicit boundary + expected warn/blocked semantics”的写法，避免重新回到能力罗列式描述。
3. 新增一节“what to ignore / what to keep under version control”，把 generated artifacts policy 从 implementation detail 升级为 operator-facing guidance。
4. 为 clean-room/operator evidence 单独保留回链入口，避免后续只能从 sprint task 深处挖到实证。

### 6.3 Governance And Validation

1. 后续所有 adopter-facing docs truth 变更，建议继续要求至少一份 real-target 或 clean-room evidence packet 后再落 public support truth。
2. 将“operator 是否会因步骤顺序误判状态”纳入 future rollout 的显式验收项，而不只验证命令能否成功执行。
3. 在 release 或 docs change window 中增加一个 lightweight support-truth parity checklist，至少对 README、playbook、support matrix 的 self-host path 做逐项比对。
4. 若后续扩展 starter template shape，应优先补 focused parser coverage；当前 starter-template CSV parser 仍是刻意 narrow 的实现边界，不适合在没有新测试的情况下扩大输入复杂度。

## 7. Suggested Follow-Up Backlog

1. 增加 self-host first-run concise summary / next-action UX 改进任务。
2. 增加 clean-room reset and replay harness 任务，减少 maintainer 手工清理步骤。
3. 增加 generated-artifact version-control guidance 的 operator-facing docs 任务。
4. 增加 policy gate onboarding copy 优化任务，解释 `confirm` 与常见 risk reasons。
5. 增加 support-truth parity gate 或 checklist 任务，降低多份 adopter-facing docs 再次漂移的概率。

## 8. Bottom Line

1. `project-123` 已把最关键的 runtime truth、docs truth 与 operator truth 收口到一致状态。
2. 这次实地采用说明，本产品接下来的高价值优化不再只是“再补一个命令”，而是继续降低 self-host first-run 的认知成本、减少人工判断、并让 generated artifacts 与 readiness semantics 更容易被正确理解。
