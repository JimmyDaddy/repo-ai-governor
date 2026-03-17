# TS Vitest V1

- Status: active
- Date: 2026-03-17
- Project: `ts-vitest-v1`

## Goal

将当前以 JavaScript 为主的 CLI 工程重构为“源码 TypeScript 优先”，并把测试基线统一到 Vitest，同时使用 Biome 作为统一 formatter + linter，提升类型安全、测试反馈速度和后续迭代可维护性。

## Files

- [execution-plan.md](./execution-plan.md): 项目级技术路线、迁移策略与多 sprint 迭代目标。
- [sprint-001/index.md](./sprint-001/index.md): 当前 sprint 的执行入口与任务拆解。

## Notes

1. 该项目遵循“非必要不使用 JS”，仅保留极少数运行时入口 JS 包装层。
2. 代码风格与静态规则统一由 Biome 收敛，降低多工具链维护成本。
3. 本项目输出以可执行迁移路径为主，避免一次性大爆炸改造。
