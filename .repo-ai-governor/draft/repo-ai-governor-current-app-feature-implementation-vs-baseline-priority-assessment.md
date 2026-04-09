# Repo AI Governor 当前应用功能实现度、Baseline 占位面与优先级评估（Draft）

- Status: draft
- Date: 2026-04-08
- Owner: AI-Agent
- Scope: 基于当前仓库代码与文档真值，判断哪些功能已经进入正式实现/支持，哪些仍只是 baseline / MVP / foundation / fallback-only / reserved 占位，并给出后续优先级排序。
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `docs/support-matrix.md`
  - `README.md`
  - `apps/cli/README.md`
  - `apps/desktop/README.md`
  - `apps/vscode-extension/README.md`
  - `integrations/ci/README.md`
  - `packages/standards/README.md`
  - `packages/adapters/local-model/README.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
  - `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`

## 1. 结论先行

当前仓库最成熟、最接近正式产品面的仍然是 CLI 主入口及其配套治理链路，而不是 desktop 或 VS Code 这些 secondary surface。

这次重新核对后，最重要的结论有三点：

1. 不能再把一些已经收口的能力继续误报成“缺失”。
   - 例如 GitLab CI / Jenkins 官方模板、standards runtime loader、host-native distribution 主体、Codex / Claude Code / GitHub Copilot real-path baseline，都已经不是“未来能力”。
2. 也不能把明确写成 baseline / MVP / foundation / fallback-only / reserved 的 surface 误说成“已经 fully productized”。
   - 例如 desktop 仍只是 foundation、VS Code extension 仍是 source-checkout-only companion MVP、`local-model` 仍只是 fallback-only real-path。
3. 当前真正还需要继续实现或产品化的缺口，优先级应回到主产品面和 adopter 真相上。
   - 首先是 CLI 的真实 provider-native 连续性和 adapter probe / verify truthfulness。
   - 其次是 adopter-facing distribution truth，包括 packaged install，以及 Codex / Claude Code host plugin / skill / agent 的 lifecycle / support-truth / adopter consumption。
   - 再往后才是 VS Code / desktop secondary surface 产品化，以及 standards / language 生态扩展。

## 2. 当前端面真实状态总表

| 端面 / 能力 | 当前判断 | 依据 | 结论 |
|---|---|---|---|
| CLI 主入口（`init/connect/doctor/check/verify/plan/run/review/review-verify/host/workspace/upgrade/workflow/resume`） | 正式实现中的主产品面 | `README.md`、`docs/support-matrix.md`、`apps/cli/src/constants/cli-command.constant.ts` | 这是当前最成熟、最该优先继续收口的 surface |
| Session shell / resume / slash command | 已实现，属于 CLI 正式交互层 | `README.md`、`docs/local-adoption-playbook.md` | 不是 demo；但连续性体验仍有更高阶能力缺口 |
| Multi-tool onboarding + adapter verify/run/review 闭环 | 已实现 | `README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` | 已有正式 adopter 路径，但真实性与稳定性还需继续打磨 |
| Codex / Claude Code / GitHub Copilot real-path | 已实现，环境前置条件驱动 | `docs/support-matrix.md` | 不再是 fixture-only；但 probe truthfulness 仍有回归风险 |
| `local-model` (`ollama`) | 正式支持，但仅 fallback-only real-path | `docs/support-matrix.md`、`packages/adapters/local-model/README.md` | 属于保守支持面，不应误报为主路由等价替代 |
| Host-native distribution（project-local / plugin / hooks / skills / subagents / MCP） | baseline 已完成，但 formal follow-up 已显式化 | `project-050` closeout、`README.md`、新的 PRD / brief / 总技术方案 / 架构蓝图 | 主体建设已完成，但 host-native asset lifecycle / upgrade / support-truth / adopter consumption 已成为正式后续缺口，不应再只归结为 reserved target |
| CI 模板（GitHub Actions / GitLab CI / Jenkins） | 已实现 | `integrations/ci/README.md` | 旧 draft 里“缺 GitLab/Jenkins”的判断已过时 |
| Standards runtime loader + built-in packs | 已实现 | `packages/standards/README.md` | runtime loader 已不是待实现项；真正的缺口在生态广度 |
| VS Code extension | 已实现，但只是 editor companion MVP | `apps/vscode-extension/README.md`、`docs/support-matrix.md` | 不是 demo sample，但仍不是 fully productized adopter surface |
| Desktop sidecar entry | 已实现，但只是 foundation surface | `apps/desktop/README.md`、`integrations/desktop/README.md`、`docs/support-matrix.md` | 不能误报成完整桌面产品 |
| `tgz` packaged install | 仅在线 packaged rehearsal | `README.md`、`docs/support-matrix.md`、`docs/local-adoption-playbook.md` | 仍不是 self-contained/offline packaged distribution |
| GitHub.com coding agent target | reserved / non-MVP | 既有 draft、host target 语义 | 明确属于后续占位，不是当前未收口 bug |

## 3. 已经不是缺口的事项

以下项目在较早的 draft 中曾被当成 gap，但按 2026-04-08 当前仓库状态看，已经不能再算“待实现”：

1. `GitLab CI` 与 `Jenkins` 官方模板缺失
   - `integrations/ci/README.md` 已明确存在 GitHub Actions / GitLab CI / Jenkins 三套模板。
2. standards runtime loader 仍未落地
   - `packages/standards/README.md` 已明确 `StandardsRuntimeLoader` 存在，并支持 `official / team / repository` 三层 source group。
3. 主流 CLI adapter 只有 fixture-backed 没有真实调用
   - `docs/support-matrix.md` 已把 `codex`、`claude-code`、`github-copilot` 标为 `Real-path available (environment-gated)`。
4. host distribution 仍停留在概念或 sample
   - 当前已经有 `host export / verify / pack` 及 project-local / plugin / hooks 相关资产；但新的 formal triad 已明确把 host-native asset lifecycle / upgrade / support-truth / adopter consumption 提升为正式 follow-up，而不再只是 `github-com-agent` reserved target 的单点问题。

## 4. 当前仍只是 Baseline / MVP / Foundation / 占位的能力

以下能力已经“有东西”，但仍不应被当作 fully productized：

### 4.1 Desktop sidecar

判断：`foundation only`

依据：

1. `apps/desktop/README.md` 明确写的是 `Phase 0 + Phase 1 foundation`。
2. `docs/support-matrix.md` 明确写的是 `Supported for MVP foundation only`。
3. `integrations/desktop/README.md` 明确说明当前 baseline 不是 packaged desktop distribution 的正式支持声明。

含义：

1. desktop 不是 demo，但也还不是当前最成熟的 adopter-facing secondary surface。
2. 它更像被冻结了 transport / preload / renderer / service seam 的 foundation shell。

### 4.2 VS Code extension

判断：`companion MVP`

依据：

1. `apps/vscode-extension/README.md` 明确是 `editor companion MVP`。
2. 当前正式支持路径仍是 built source checkout + extension-development host。
3. `pnpm` 包、`tgz`、VSIX、Marketplace distribution 全部仍不在正式支持边界内。

含义：

1. 它不是“仅剩 demo skeleton”，因为 activity bar、views、chat participant、service-runtime 边界都已落地。
2. 但它还不具备 packaged adopter delivery，也不替代 CLI bootstrap 或 session shell。

### 4.3 `local-model`

判断：`fallback-only real-path`

依据：

1. `docs/support-matrix.md` 直接使用 `Fallback-only real-path (local-runtime constrained)`。
2. `packages/adapters/local-model/README.md` 明确不把 `tool_calling`、`structured_output`、`confirmation_gate` 误报成完整实现。

含义：

1. 这是正式支持的本地 fallback 面。
2. 但它不是当前主 remote adapter 的等价替代。

### 4.4 Built-in standards packs

判断：`minimal baseline`

依据：

1. `docs/support-matrix.md` 中 `workflow review`、`Python`、`Go` 都明确标成 `Minimal baseline`。
2. `packages/standards/README.md` 也强调这些是“最小可用”模板，而不是完整最佳实践全集。

含义：

1. standards runtime 已有，但生态内容仍偏薄。
2. 真正的缺口不在 loader，而在官方 pack 的覆盖面和深度。

### 4.5 Packaged install / distribution

判断：`rehearsal-level baseline`

依据：

1. `README.md` 与 `docs/local-adoption-playbook.md` 都明确 `tgz` 仍需 npm registry。
2. `docs/support-matrix.md` 只把 `tgz` 标成 `Supported (online)`，并明确离线/self-contained 仍 unsupported。

含义：

1. 当前能证明 packaged rehearsal，不等于 packaged adopter delivery 已全面收口。
2. 这仍是外部 adopter 体验上的真实缺口。

### 4.6 GitHub.com coding agent target

判断：`reserved placeholder`

依据：

1. 既有 draft 与 host target 语义都把它保留为 reserved / non-MVP。

含义：

1. 这不是现阶段漏掉的 bug，而是刻意尚未承诺的后续 target。
2. 只有当前面主线收口后，才值得进入更高优先级。

### 4.7 Host-native plugin / skill / agent assets

判断：`baseline completed, follow-up required`

依据：

1. `project-050` 已完成 project-local export、plugin bundles、hooks / subagents / MCP 的 baseline rollout。
2. 新的 PRD / brief / total technical solution / architecture 现在已显式要求首批入口承载 host-native assets 的 `export / apply / verify / upgrade / support-truth` contract。
3. `README.md` 目前只对 `.codex/skills/` 做了局部 adopter 提示，support matrix 也还没有把整组 host-native assets 收敛成清晰的 public support-truth 叙事。

含义：

1. host-native assets 不再是“有没有 baseline”的问题，而是“有没有正式 lifecycle / upgrade / adopter-consumption truth”的问题。
2. 它们既不能被继续误报成“未实现”，也不能被误说成“只剩 reserved host target”。

## 5. 仍需继续实现或产品化的功能缺口

以下是按当前产品影响度排序的建议优先级。

### P0

#### 5.1 CLI 真正的 provider-native 会话连续性

当前状态：

1. 最近 `project-058 / project-059` 修复的是：
   - backend continuation `unsupported` 时的 lightweight fallback
   - presenter / transcript 的 truthful degradation
2. 这意味着当前 CLI 已经能“保住一点连续性”，但仍不是稳定的 provider-native backend session reuse。

为什么是 P0：

1. CLI 是当前正式主入口。
2. 用户已经直接反馈“会话没有连续性”。
3. 只靠 session-note fallback 仍无法满足用户对真正连续对话的预期。

建议目标：

1. 把 `created / reused / refreshed / fallback-active / unsupported` 这些状态做成稳定的 provider continuation 能力面。
2. 尽可能把真实 provider-native reuse 与 fallback reuse 分开表达，而不是继续混在“有点连续”里。

#### 5.2 Adapter probe / verify truthfulness 稳定化

当前状态：

1. support matrix 已经把 `codex`、`claude-code`、`github-copilot` 提升到 real-path available。
2. 但 recent user feedback 与 `project-058 / project-059` 说明 probe/verify/presenter 这条真值链仍可能出现“本机可用但探测失败”或“fallback 已生效但提示像故障未修”的问题。

为什么是 P0：

1. 这同样发生在 CLI 主入口。
2. 会直接破坏用户对“工具说的和实际能不能用是否一致”的信任。

建议目标：

1. 收敛 `connect -> doctor --adapters -> verify --adapters -> session shell transcript` 的同一真值源。
2. 对 probe failure、auth failure、quota failure、transport fallback、continuity fallback 做更精确分类，避免继续出现误导性失败提示。

### P1

#### 5.3 Packaged adopter distribution 收口

当前状态：

1. `path` / `link` / `dist-binary` 都已有正式路径。
2. 但 `tgz` 仍不是 offline/self-contained packaged install。

为什么是 P1：

1. 这会影响外部 adopter 的“正式交付”感，而不是主入口本身是否可用。
2. 相比 CLI 主链 truthfulness，它的重要性稍低，但仍属于真实 adoption gap。

建议目标：

1. 明确是要补齐真正自包含的 packaged install，还是继续把 online rehearsal 作为正式边界。
2. 若要补齐，必须同时刷新 support matrix、playbook 和验证脚本。

#### 5.4 Host-native plugin / skill / agent lifecycle 与 adopter consumption

当前状态：

1. `project-050` 已完成 project-local export、plugin bundles、skills / agents、hooks / subagents / MCP 的 baseline rollout。
2. 但新的 formal triad 现在明确要求这些 host-native assets 具备 `export / apply / verify / upgrade / support-truth` contract。
3. 当前 public truth 仍缺少一条对 Codex / Claude Code host assets 的完整 adopter-facing narrative，它们还容易被混进“工具适配已完成”或“只剩 reserved target”两种过粗口径里。

为什么是 P1：

1. 这已经不是 draft 自己补出来的偏好项，而是正式 PRD / 技术方案 / 架构蓝图共同承认的后续能力。
2. 它直接影响首批正式入口的 adopter 消费真相，而不仅是内部实现整洁度。
3. 相比 CLI 主链 truthfulness 它仍次一级，但优先级已经高于 desktop foundation 或生态扩展。

建议目标：

1. 冻结 Codex / Claude Code host-native assets 的 lifecycle / upgrade / support-truth contract。
2. 补齐 README / support matrix / playbook / pack receipt / verify report 的回链叙事。
3. 让 `.codex-plugin`、`.claude-plugin`、`.codex/skills`、`.claude/skills`、Codex subagents、Claude hooks / MCP 的 adopter consumption 说法一致。

#### 5.5 VS Code extension 从 companion MVP 走向真正可分发 secondary surface

当前状态：

1. 扩展本体已存在。
2. 但 delivery 仍是 source-checkout only，且缺少 VSIX / Marketplace / packaged npm path。

为什么是 P1：

1. 它已经不是 sample，所以继续产品化的收益高。
2. 但 secondary surface 的优先级仍低于 CLI 主链本身。

建议目标：

1. 先补官方 packaged boundary 与真实 extension-host smoke。
2. 再决定是否把它提升到更明确的 adopter-facing supported secondary surface。

#### 5.6 Desktop 从 foundation 走向真正 command-center 产品面

当前状态：

1. desktop contract、shell bootstrap、typed preload bridge、query seams 已冻结。
2. 但 support matrix 仍只把它定义为 `MVP foundation only`。

为什么是 P1：

1. 它离“可用产品面”仍差 packaged story 和公开支持边界。
2. 但相比 VS Code，当前策略仍是 `VS Code first / desktop foundation`，因此优先级应略后。

建议目标：

1. 先决定 desktop 是否要成为正式 secondary surface。
2. 若答案是是，再收口 packaged desktop distribution 与 richer command-center panels 的公开支持范围。

#### 5.7 Standards / language 生态扩展

当前状态：

1. loader 已有，runtime 也有。
2. 但官方 packs 仍主要是 workflow-review、Python minimal、Go minimal。

为什么是 P1：

1. 这影响 PRD 中“多语言仓库与多团队复用”的兑现度。
2. 但它不比 CLI truthfulness 或 packaged distribution 更紧急。

建议目标：

1. 优先明确官方要长期维护哪些语言/框架 pack。
2. 不要再把 loader 做得更深，而忽略 pack 内容本身仍偏薄。

### P2

#### 5.8 `local-model` 高阶能力对齐

当前状态：

1. 已有真实 probe/invoke。
2. 但仍明确不承诺 `tool_calling`、`structured_output`、`confirmation_gate` 等高阶能力。

为什么是 P2：

1. 这是保守支持面，不是当前主路由。
2. 只有在主 remote adapter 和主 adoption path 更稳定后，才值得追求能力对齐。

#### 5.9 GitHub.com coding agent target

当前状态：

1. 仍是 reserved / non-MVP。

为什么是 P2：

1. 这是明确的后续 target，不是当前主入口缺口。
2. 在 CLI 主链、packaged distribution、secondary surface 产品化之前，不应被提前上提。

## 6. 推荐执行顺序

建议按以下顺序继续推进：

1. 先收 CLI 主入口真值
   - provider-native continuity
   - adapter probe / verify truthfulness
2. 再收 adopter-facing distribution truth
   - `tgz`/package install 真值
   - host-native plugin / skill / agent lifecycle 与 support-truth
3. 再推进 secondary surface 的正式产品化路径
   - VS Code packaged distribution
   - desktop secondary-surface decision
4. 最后再扩生态面
   - standards/language packs
   - `local-model` 高阶能力
   - reserved host targets

## 7. 对后续拆解的建议

如果要把这份 draft 直接转成下一轮执行流，最合理的下一步不是“大而全地继续铺面”，而是从下面两条主入口里选：

1. 走主入口质量线：
   - 新建一条 CLI hardening project，专门收 `provider-native continuity + probe truthfulness`
2. 走 adopter truth line：
   - 先收 packaged distribution，再紧接 host-native plugin / skill / agent lifecycle，形成一条连续的 adopter-facing distribution truth lane

## 8. 备注

1. 本文是基于 2026-04-08 当前仓库状态的 draft，不替代 PRD 或正式 project plan。
2. 若后续 support matrix、README 或相关 surface README 再次刷新，本文中的“已实现 / baseline / placeholder”判断也应同步重审。
