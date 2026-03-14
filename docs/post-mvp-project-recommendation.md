# Post-MVP Project Recommendation

- Date: 2026-03-14
- Basis:
  - [product-requirements.md](./product-requirements.md)
  - [mvp-execution-plan.md](./mvp-execution-plan.md)
  - `mvp / sprint-001` to `sprint-008` current implementation

## Goal

在 `mvp` 主线已经基本完成后，把 PRD 中剩余的价值点重新按“Project”而不是“零散 task”进行归并，便于决定下一个正式项目应该是什么。

## PRD Status Summary

按 PRD 当前目标来看，MVP 已完成的部分包括：

1. npm 包、CLI、初始化、检查、计划、评审、报告、升级最小版本。
2. 标准流程模板、规范包、项目/sprint 任务产物与 CR 生命周期。
3. 声明式插槽、运行时冲突处理、脚本扩展接口预留。
4. 首批适配入口：
   - Codex / Codex CLI
   - GitHub Copilot / GitHub Copilot CLI
   - Claude Code
5. 报告输出、CI 调用约定、示例 CI 模板、MVP 验收脚本。
6. 双语规则与人类/AI 双视图渲染基础。

仍然没有完全做实的 PRD 方向主要有：

1. 真正的对外发布与用户上手链路
2. 自动模式 `v1`
3. 第二批适配器的真实落地
4. 多编程语言治理模板
5. 团队共享规范与平台化能力

## Recommended Project Set

### Project A: `release-ga`

## Why

当前仓库已经“可发布候选”，但还没有真正走到对外可安装、可试用、可发布运营的状态。这个项目的目标是把 MVP 从“研发完成”推进到“可对外发布”。

## Scope

1. npm 正式发布流程
2. 远端仓库 release workflow
3. README / 快速开始 / 示例仓库
4. 版本策略、changelog、发布说明
5. 安装后首轮体验打磨

## PRD Mapping

对应 PRD：

1. `8.1` 分发与安装
2. `4.1.1` 通过 npm 安装后快速启用
3. `13` 易用性

## Value

1. 最快让真实用户开始试用
2. 最快验证“本地治理工具”这条产品路径是否成立
3. 能为后续自动化和生态扩展带来真实反馈

## Project B: `automation-v1`

## Why

这是离原始愿景“AI 完全自动化按照流程规范进行开发”最近、同时也是当前最大功能缺口的项目。

## Scope

1. Automation Controller 最小版本
2. 分级授权与门禁执行
3. 自动模式下的阶段推进
4. 操作审计与失败回退
5. 高风险动作人工确认

## PRD Mapping

对应 PRD：

1. `8.6` AI 全自动开发模式
2. `17.4` 自动模式默认权限边界
3. `11` Automation Controller

## Value

1. 直接补齐产品定义里最关键的未完成能力
2. 把“治理工具”从检查器提升为真正的执行编排器
3. 更能体现和普通 lint / workflow 工具的差异

## Risk

1. 风险最高
2. 需要最严格的权限、安全、审计设计
3. 没有真实用户反馈前过早做深，可能会走偏

### Project C: `ecosystem-v2`

## Why

首批适配器已经完成，但 PRD 里明确希望支持更多主流 IDE、CLI Agent 和 API 驱动入口。这个项目适合在首批样例验证后继续扩大覆盖面。

## Scope

1. Cursor 接入
2. VS Code 通用工作流接入
3. API-driven mode
4. Cline / Roo Code 评估与首批实现
5. 适配器兼容性文档

## PRD Mapping

对应 PRD：

1. `8.7` 模型与工具适配
2. `17.2` 第一批必须支持的入口之后的扩展

## Value

1. 提升市场覆盖面
2. 更容易把规范注入能力扩散到不同工具生态
3. 对开源增长更友好

### Project D: `language-packs-v1`

## Why

当前产品虽然支持多语言规则视图，但真正可用的多编程语言治理模板还没有系统铺开。

## Scope

1. Python 治理模板
2. Go 治理模板
3. Java 治理模板
4. Rust 治理模板
5. 语言差异化检查链路

## PRD Mapping

对应 PRD：

1. `8.8` 多语言支持
2. `4.1.7` 支持多语言仓库

## Value

1. 把产品从“JS/TS 倾向”推进到真正的多技术栈工具
2. 更适合团队和平台侧场景

### Project E: `team-governance`

## Why

这是“从本地工具走向团队平台”的第一步，适合在单仓库价值被验证后再做。

## Scope

1. 团队共享规范包
2. 远程策略源
3. 多仓库复用
4. 组织级审计接口预留

## PRD Mapping

对应 PRD：

1. `17.1` 先做本地工具，再向团队平台演进
2. `12` 配置模型中的 team/shared 能力
3. `10` P1 / P2 的共享规范与平台化方向

## Value

1. 更强的组织级价值
2. 更利于商业化和平台化

## Recommended Order

如果目标是“最小风险、最快形成真实产品反馈”，建议按这个顺序：

1. `release-ga`
2. `automation-v1`
3. `ecosystem-v2`
4. `language-packs-v1`
5. `team-governance`

## Primary Recommendation

当前最适合立项的 Project 是：`release-ga`

理由很简单：

1. MVP 现在已经足够完整，最缺的不是继续补内部能力，而是把它变成真正可试用的产品。
2. 没有真实用户和真实仓库反馈前，直接做 `automation-v1` 风险偏高。
3. `release-ga` 完成后，再做 `automation-v1` 和 `ecosystem-v2`，判断会更准。

## Suggested First Sprint For `release-ga`

建议首个 sprint 聚焦 4 件事：

1. 正式发布流程与版本策略落地
2. README / Quick Start / 示例仓库整理
3. 安装后 10 分钟内跑通的体验打磨
4. 远端 release / tag / changelog 自动化

## If You Prefer To Maximize Product Differentiation

如果你的目标不是先发布，而是尽快拉开产品差异化，那就直接开：`automation-v1`

这条路径更“产品导向”，但前提是你接受：

1. 设计和实现风险更高
2. 需要更长的安全验证周期
3. 更适合在已有一小批试用用户后启动
