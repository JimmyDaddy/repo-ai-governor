# ADR: VS Code Primary Full Governance Workbench

- Status: active
- Date: 2026-04-16
- Module: `runtime.governance-clients`

## 1. Context

现有 `runtime.governance-clients` active truth 把产品分工冻结为 `Desktop outer-loop governance command center + VS Code inner-loop editor companion + CLI automation/scriptable entry`。这条 split 在 early productization window 有效，但它已经成为 adoption friction：

1. 用户希望在 VS Code 内完成 governed run / review / review-verify、task/review queue、session continuity、HITL、workflow visibility 与 adoption/host operations，而不是频繁切换到 desktop 或 CLI。
2. shared local orchestration service 已拥有 queue、session、execution 等基础 seam；当前缺口更多是 surface contract、aggregation facade 与 workbench 信息架构，而不是缺乏 runtime substrate。
3. 如果继续把 VS Code 固定为 `inner-loop editor companion`，正式文档就会长期压制 full workbench 方向，并让 richer editor affordance 永远停留在 deferred follow-up。

## 2. Decision

正式接受以下 planning-side formal direction：

1. `VS Code` 成为 `primary governance workbench` 的默认产品方向。
2. `CLI` 保留 `automation / CI / scriptable / headless substrate` 身份。
3. `Desktop` 在当前方案窗口内冻结为 `foundation-only secondary surface`；是否进一步演进为 `coexisting secondary surface`、`optional shell` 或进入更强 de-scope，必须等待独立 desktop decision surface 与真实 rollout evidence。
4. VS Code workbench 必须采用 `native-first + selective workbench panel` 的 hybrid model，而不是无限制 webview shell。
5. task / workflow / review / automation / adoption / host operations 这类 surface 只能消费 service-owned aggregation facade，不得直接解析 `.repo-ai-governor/**` canonical truth。

## 3. Supersede Scope Freeze

1. 本 ADR supersede 的是 companion-era split/companion-only planning truth，而不是 `technical-solution.governance-surface-clients` 的全部 active truth。
2. 以下旧 truth 保持有效：
   - host-native distribution boundary
   - adoption pack / installer boundary
   - local config / secret authoring boundary
3. companion-era split ADR 保留为历史基线，用于解释为什么产品最初采取 desktop-first/VS Code-companion split；但从本 ADR 生效起，它不再是 planning-side 的最新目标方向。

## 4. Public Support Truth Freeze

1. planning-side formal direction 与 adopter-facing support truth 必须分层治理。
2. `apps/vscode-extension/README.md`、`docs/support-matrix*.md`、`docs/local-adoption-playbook*.md` 与 `integrations/desktop/README.md` 只有在对应 phase evidence 落地后才允许改口。
3. 因而在当前方案 promotion 窗口内：
   - `VS Code` 最多只能被 public support docs 描述为 `companion-upgraded / workbench baseline in progress`
   - `Desktop` 仍保持 `foundation-only secondary surface`
4. 只有当 workflow studio、adoption/host cutover、desktop decision surface 与 support-truth refresh 一起闭环后，`VS Code primary workbench` 才能成为公开支持口径。

## 5. Consequences

1. `runtime.governance-clients` 必须新增专门的 VS Code workbench surface contract，而不是继续只靠 companion-era `governance-surface-client.v1` 勉强扩容。
2. `runtime.orchestration` 必须 formalize service-owned governance workbench aggregation facade，明确 task/review/workflow/automation/adoption seam 的 authoritative owner split。
3. typed CLI bridge 只能作为 temporary path，并必须显式携带 exit criteria；它不能成为长期“VS Code shell over CLI”借口。
4. rollout 推荐按 `Phase A -> Phase B -> Phase C` 推进：
   - `Phase A`: task/review queue 与 primary workbench baseline
   - `Phase B`: outer-loop consolidation、automation queue、typed bridge governance
   - `Phase C`: workflow studio、desktop decision surface、support-truth cutover

## 6. Follow-Up

1. formal promotion 完成本轮 planning-side cutover 后，真实 rollout 由 `project-112-vscode-governance-workbench-rollout` 承接。
2. 若 desktop 需要进一步降级或移出默认 narrative，必须新建独立 technical solution 或等价 decision surface，而不是在本 ADR 中顺手删除 desktop truth。
