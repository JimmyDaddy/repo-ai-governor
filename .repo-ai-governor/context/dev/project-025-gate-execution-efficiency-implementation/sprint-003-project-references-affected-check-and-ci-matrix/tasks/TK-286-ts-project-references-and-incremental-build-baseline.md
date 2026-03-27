# TK-286 ts project references 与 incremental build baseline

- Status: in_progress
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-003-project-references-affected-check-and-ci-matrix`

## 1. 任务目标

为核心 package 引入 TS project references，建立增量编译 baseline，使 `tsc --build` 可在 package graph 上增量执行。

## 2. Depends On

1. `TK-285`（sprint-002 exit criteria + sprint-003 输入约束）

## 3. 预期产物

1. 核心 package 的 `tsconfig.build.json` 引入 `references` 字段。
2. `tsc --build` 增量编译可用，`.tsbuildinfo` 正确生成并被 `.gitignore` / turbo cache 覆盖。
3. 现有 `rootDir: "../.."` + `outDir: "../../dist"` dist-mirroring 模式保持兼容。

## 4. 实施计划

1. 在 4 个核心 package 的 `tsconfig.build.json` 中添加 `references` 与 `composite: true`。
2. 配置 `.tsbuildinfo` 输出路径并确保被 `.gitignore` 覆盖。
3. 验证 `tsc --build` 增量编译链路：首次全量 → 二次增量跳过。
4. 确保 turbo cache 与 tsc incremental build info 不冲突。

## 5. 待验证

```bash
pnpm run typecheck
pnpm run build
pnpm run check
```

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：sprint-003 激活，状态切换为 `in_progress`。
