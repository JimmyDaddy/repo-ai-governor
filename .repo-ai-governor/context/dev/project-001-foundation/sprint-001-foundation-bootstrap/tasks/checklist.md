# checklist

- [x] TK-001 项目拆解与基线落盘
  - 2026-03-19: 基于 `repo-ai-governor-master-execution-plan.md` 完成 7 个 project 拆解、主执行流目录初始化与 context 路径修正。
- [x] TK-002 依赖产物登记与消费基线
  - 2026-03-19: 参照 `/Users/jimmydaddy/study/repo-ai-governor/docs/dev/dependency-artifact-registry.md` 建立登记基线；收敛准入规则为“规范/基线/约束”类产物；仅保留 DA-002 并同步 index 与机器可读 registry。
- [x] TK-003 project-001 细化与基线约束文档
  - 2026-03-19: 完成 project-001 的 workstream/sprint/task 细化并产出 `DA-003` 供后续任务依赖消费。
- [x] TK-004 Monorepo 边界与 CI 骨架基线
  - 2026-03-19: 完成 `pnpm-workspace.yaml` 与 `integrations/ci` 基线模板落盘；产物登记为 `DA-004`，并同步后续任务依赖关系。
- [x] TK-005 Config 包基线实现方案
  - 2026-03-19: 完成 `packages/config` 的 loader/schema/profile 三类契约骨架与 `DA-005`，并补齐 CLI 消费约定与依赖回链。
  - 2026-03-19: 输出 ESM 相对导入扩展名取舍讨论稿，沉淀“收益/风险/替代方案/迁移清单”供规范决策评审。
  - 2026-03-19: 输出 i18n 社区方案对比与“仅针对本仓库”选型结论，包含推荐方案、最小迁移计划与回滚策略。
  - 2026-03-19: 确认 i18n 选型为 `i18next`，并同步到需求/方案/架构文档；新仓库策略调整为 `fix-forward`（不单独建设 i18n 回滚链路）。
- [x] TK-006 CLI 命令骨架与 smoke 基线
  - 2026-03-19: 完成 `apps/cli` 八个命令骨架与 `packages/shared` i18next runtime 基线，新增 smoke 测试并通过 `pnpm run test` 与 `pnpm run check`；登记 `DA-007/DA-008/DA-009`。
- [x] TK-007 依赖边界 warning gate 基线
  - 2026-03-19: 新增 `check-package-dependency-boundary` warning gate 与空白名单基线，接入 `pnpm run check` 并形成 `DA-010/DA-011`；`pnpm run check` 通过，当前违规计数为 0。
- [ ] TK-008 sprint-001 出口验收基线
