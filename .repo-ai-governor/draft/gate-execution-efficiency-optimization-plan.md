# Gate 执行效率优化与并行化改造方案（Draft）

- Status: draft
- Date: 2026-03-27
- Owner: AI-Agent
- Scope: `gate orchestration / turbo task graph / package-level build-test decomposition`
- Related:
  - `package.json`
  - `turbo.json`
  - `tsconfig.json`
  - `tsconfig.build.json`
  - `pnpm-workspace.yaml`
  - `scripts/ci/run-gate-check.js`

## 1. 背景与当前瓶颈

当前仓库已经引入 `turbo`，但 gate 实际上仍以“根包单体 orchestrator”方式运行，主要瓶颈有四类：

1. gate 入口高度集中在根 `package.json`，大量检查仍由根脚本直接串起。
2. `turbo.json` 中几乎所有任务都是 `//#gate:*` 根任务，且 `cache=false`，无法充分利用 Turbo 的 package graph 与缓存能力。
3. 大多数 gate 都依赖一次全仓 `build`，即使是纯文档/台账/治理扫描，也要等待全仓构建完成后才能开始。
4. `tsconfig.build.json` 仍是单体全仓编译；`apps/*` 与 `packages/*` 基本没有自己的 `build / typecheck / test` 脚本，Turbo 无法按包增量执行。

结果是：

1. 本地反馈链路长，尤其是只改一两个 package 时也要等待全仓 gate。
2. CI 关键路径过长，重跑成本高。
3. “哪些 gate 真正依赖 build / 哪些可以直接并行跑”当前没有被结构化表达。

## 2. 改造目标

1. 将 gate 分成三层：
   - repo-global gates
   - package-local gates
   - heavy/runtime gates
2. 将“只改一个包就全仓重跑”的成本降低到“只跑受影响包 + 必要的全局治理 gate”。
3. 保持当前 `check` 的完整语义不回退，同时新增更适合本地开发与 PR 的 `check:fast` / `check:affected`。
4. 为后续引入 TS project references、Turbo remote cache、CI matrix 做准备。

## 3. 非目标

1. 本轮不直接重写所有测试配置。
2. 本轮不把所有重型 smoke/e2e 都变成 package-local。
3. 本轮不要求一步到位完成 monorepo 全量 project references。
4. 本轮不改变现有治理脚本本身的业务逻辑，只优化编排方式与执行边界。

## 4. 总体方案

### 4.1 三层 gate 模型

#### A. Repo-global gates

这类检查关注整个仓库的真值一致性，不依赖具体 package 的产物：

1. `docs-triad-sync`
2. `technical-solution-module-graph`
3. `technical-solution-lifecycle-registry`
4. `technical-solution-delivery-registry`
5. `task-ledger-sync`
6. `sprint-plan-status-sync`
7. `code-review-status-sync`
8. `worktree-review-target`
9. `artifact-lifecycle`
10. `normative-loading-manifest`

这些任务应尽量不再依赖全仓 `build`，并允许与 package build/test 并行。

#### B. Package-local gates

这些检查应该下沉到 `apps/*` 与 `packages/*`：

1. `build`
2. `typecheck`
3. `test:unit`
4. 局部 `lint`（可在第二阶段接入）

这样 Turbo 才能根据 workspace 依赖图做增量执行。

#### C. Heavy/runtime gates

这类任务通常更慢、更依赖运行环境，适合作为独立 profile / 独立 CI job：

1. `test:integration`
2. `test:e2e`
3. `test:resilience`
4. `examples` smoke
5. `ide / desktop` smoke
6. `stage9-blackbox-ga`

## 5. 推荐实施顺序

### Phase 1：根级编排瘦身与并行化

目标：不大改包结构，先把“无谓的 build 串行前置”拆掉。

动作：

1. 调整 `turbo.json`，将 repo-global gates 从 `//#gate:build` 依赖链中拆出来。
2. 给确定性强的 repo-global gates 打开 Turbo cache。
3. 保留 `check` 为完整全量入口。
4. 新增：
   - `check:fast`
   - `check:affected`
   - `check:full`（或保持 `check` = full）

预期收益：

1. 文档/治理检查可以和 build / unit test 并行。
2. 本地开发时可以优先跑 `check:fast`，不必总走最重路径。

### Phase 2：将 build/typecheck/test 下沉到 package

目标：让 Turbo 真正吃到 workspace package graph。

动作：

1. 为核心 package/app 增加：
   - `build`
   - `typecheck`
   - `test:unit`
2. 第一波先覆盖：
   - `apps/cli`
   - `packages/core-memory-semantics`
   - `packages/reporting`
   - `packages/shared`
   - `packages/config`
3. 后续逐步扩展到其他 package。

预期收益：

1. 改 `packages/core-memory-semantics` 时，只需要重跑它和依赖它的上游 package。
2. `apps/cli` 与纯库包可以解耦增量构建/测试。

### Phase 3：引入 TS project references

目标：把单体 `tsconfig.build.json` 过渡到 solution-style `tsc -b`。

动作：

1. 根 `tsconfig.build.json` 改成 solution。
2. 每个 package/app 新增自己的 `tsconfig.json` / `tsconfig.build.json`。
3. 用 `references` 明确包间依赖关系。

预期收益：

1. build 速度进一步下降。
2. TypeScript incremental build 与 Turbo cache 才能叠加产生最大收益。

### Phase 4：affected planner + CI matrix

目标：按 diff 精准挑 gate，不再每次跑整个 full gate。

动作：

1. 新增 `scripts/ci/run-affected-check.js`。
2. 基于 `git diff --name-only` 分类受影响范围。
3. CI 中拆分 job：
   - repo-global
   - package build/test
   - integration/heavy
   - release/smoke

预期收益：

1. PR 反馈更快。
2. heavy gate 与 repo-global gate 解耦，不会互相阻塞首轮反馈。

## 6. 可改文件清单

### 6.1 第一阶段建议修改

1. `package.json`
   - 新增 `check:fast` / `check:affected` / `check:full`
   - 调整根 gate 脚本分组
2. `turbo.json`
   - 重新定义 root 与 package task graph
   - 打开可缓存任务的 cache
3. `scripts/ci/run-gate-check.js`
   - 支持 profile 或切换到新的 root task
4. `tsconfig.build.json`
   - 先为后续 package build 拆分预留结构

### 6.2 第一阶段建议新增

1. `scripts/ci/run-repo-global-gates.js`
   - 只负责编排 repo-global checks
2. `scripts/ci/run-affected-check.js`
   - 根据 diff 决定跑哪些 gate profile

### 6.3 第二阶段建议修改

1. `apps/cli/package.json`
2. `packages/core-memory-semantics/package.json`
3. `packages/reporting/package.json`
4. `packages/shared/package.json`
5. `packages/config/package.json`

### 6.4 第二阶段建议新增

1. `apps/cli/tsconfig.json`
2. `apps/cli/tsconfig.build.json`
3. `packages/core-memory-semantics/tsconfig.json`
4. `packages/core-memory-semantics/tsconfig.build.json`
5. `packages/reporting/tsconfig.json`
6. `packages/reporting/tsconfig.build.json`
7. `packages/shared/tsconfig.json`
8. `packages/shared/tsconfig.build.json`
9. `packages/config/tsconfig.json`
10. `packages/config/tsconfig.build.json`

### 6.5 第三阶段可能修改

1. `tsconfig.json`
2. `tsconfig.build.json`
3. `pnpm-workspace.yaml`
4. `vitest.packages.config.ts`
5. `vitest.integration.config.ts`

## 7. `turbo.json` 草案

下面是一个目标形态草案，重点不是逐字可落地，而是表达新的 task graph：

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    // ---------- package-local tasks ----------
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "cache": true,
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test:unit": {
      "cache": true,
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "cache": false,
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "cache": false,
      "dependsOn": ["build"],
      "outputs": []
    },
    "test:resilience": {
      "cache": false,
      "dependsOn": ["build"],
      "outputs": []
    },

    // ---------- repo-global root tasks ----------
    "//#repo:governance": {
      "cache": true,
      "outputs": []
    },
    "//#repo:docs": {
      "cache": true,
      "outputs": []
    },
    "//#repo:smoke": {
      "cache": false,
      "dependsOn": ["build"],
      "outputs": []
    },

    // ---------- composed root tasks ----------
    "//#check:fast": {
      "cache": false,
      "dependsOn": [
        "//#repo:governance",
        "//#repo:docs",
        "typecheck",
        "test:unit"
      ],
      "outputs": []
    },
    "//#check:heavy": {
      "cache": false,
      "dependsOn": [
        "test:integration",
        "test:e2e",
        "test:resilience",
        "//#repo:smoke"
      ],
      "outputs": []
    },
    "//#check:full": {
      "cache": false,
      "dependsOn": [
        "//#check:fast",
        "//#check:heavy"
      ],
      "outputs": []
    }
  }
}
```

### 7.1 这份草案相对当前结构的关键变化

1. `build` / `typecheck` / `test:unit` 变成 package-local task，而不是根任务。
2. repo-global gates 不再统一依赖 `build`。
3. heavy gate 与 fast gate 分离。
4. `cache` 不再默认全部关闭。

## 8. 根 `package.json` scripts 草案

建议保留“语义明确”的入口，而不是只保留一个 `check`：

```jsonc
{
  "scripts": {
    "repo:governance": "node ./scripts/ci/run-repo-global-gates.js --group governance",
    "repo:docs": "node ./scripts/ci/run-repo-global-gates.js --group docs",
    "check:packages": "pnpm turbo run build typecheck test:unit --output-logs=errors-only",
    "check:heavy": "pnpm turbo run test:integration test:e2e test:resilience --output-logs=errors-only",
    "check:smoke": "pnpm turbo run //#repo:smoke --output-logs=errors-only",
    "check:fast": "pnpm turbo run //#check:fast --output-logs=errors-only",
    "check:full": "pnpm turbo run //#check:full --output-logs=errors-only",
    "check:affected": "node ./scripts/ci/run-affected-check.js",
    "check": "pnpm run check:full",
    "ci:quality": "pnpm run typecheck && pnpm run check:full && pnpm run check:coverage"
  }
}
```

### 8.1 兼容性建议

1. 不建议直接把现有 `check` 偷偷改成 `fast`，否则会改变团队与 CI 对 `check` 的预期。
2. 最稳妥的做法：
   - `check` = full
   - `check:fast` = 本地默认
   - `check:affected` = PR / 小范围改动默认

## 9. 子包 scripts 草案

### 9.1 过渡期约束

在 package 还没有独立 `tsconfig.build.json` 之前，这些脚本只能作为目标草案，不一定能立即逐个执行。

建议先在“第一波核心包”落地。

### 9.2 `apps/cli/package.json` 草案

```jsonc
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test:unit": "vitest run --config ../../vitest.packages.config.ts test/**/*.test.ts",
    "gate:package": "pnpm run typecheck && pnpm run test:unit"
  }
}
```

### 9.3 `packages/core-memory-semantics/package.json` 草案

```jsonc
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test:unit": "vitest run --config ../../vitest.packages.config.ts test/**/*.test.ts",
    "gate:package": "pnpm run typecheck && pnpm run test:unit"
  }
}
```

### 9.4 `packages/reporting/package.json` 草案

```jsonc
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test:unit": "vitest run --config ../../vitest.packages.config.ts test/**/*.test.ts",
    "gate:package": "pnpm run typecheck && pnpm run test:unit"
  }
}
```

### 9.5 `packages/shared/package.json` 草案

```jsonc
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test:unit": "vitest run --config ../../vitest.packages.config.ts test/**/*.test.ts",
    "gate:package": "pnpm run typecheck && pnpm run test:unit"
  }
}
```

### 9.6 `packages/config/package.json` 草案

```jsonc
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test:unit": "vitest run --config ../../vitest.packages.config.ts test/**/*.test.ts",
    "gate:package": "pnpm run typecheck && pnpm run test:unit"
  }
}
```

## 10. `run-affected-check.js` 草案思路

建议按 `git diff --name-only` 做粗粒度路由，而不是一开始就实现复杂 dependency resolver。

### 10.1 推荐规则

1. 命中 `.repo-ai-governor/**`
   - 必跑 `repo-global gates`
2. 命中 `apps/cli/**`
   - 跑 `apps/cli` package gates
3. 命中 `packages/core-memory-semantics/**`
   - 跑 `core-memory-semantics`
   - 外加依赖它的 `apps/cli`、`packages/reporting`
4. 命中 `packages/reporting/**`
   - 跑 `reporting`
   - 外加依赖它的 `apps/cli`
5. 未命中 `examples/**` / `integrations/**`
   - 默认跳过 examples / ide / desktop smoke
6. 命中 root build config（如 `tsconfig*`, `turbo.json`, `package.json`）
   - 升级为 `check:fast`

### 10.2 初版不要做的事

1. 不要一开始就试图做完整依赖闭包计算。
2. 不要把 every-file -> exact-test 映射做得过细，否则维护成本过高。
3. 先追求“80% 改动能明显少跑”，而不是理论最优。

## 11. 风险与约束

1. package-level scripts 落地前，Turbo 虽然可以并行 root task，但还无法获得真正的 package graph 增量收益。
2. 若 `build` 产物仍混合写入全局 `dist/`，则 package-level build 的缓存命中率会受影响。
3. `examples / desktop / ide` smoke 与环境强相关，建议继续保持 `cache=false`。
4. `check` 语义一旦对外稳定，就不要轻易改成“默认 fast”；更适合新增 `check:fast`。

## 12. 建议的验收标准

### Phase 1 验收

1. repo-global gates 可以在不依赖 `build` 的情况下独立运行。
2. `check:fast` 能成功覆盖：
   - repo-global gates
   - typecheck
   - unit tests
3. 本地执行 `check:fast` 的耗时明显低于当前 `check`。

### Phase 2 验收

1. `apps/cli`、`packages/core-memory-semantics`、`packages/reporting`、`packages/shared`、`packages/config` 都具备独立 `build/typecheck/test:unit` 脚本。
2. Turbo 可以只对受影响包重跑 package tasks。

### Phase 3 验收

1. `tsc -b` 支持增量编译。
2. 改单个 package 时，不再触发全仓 TS build。

### Phase 4 验收

1. `check:affected` 能在常见单包改动下明显少跑 heavy gates。
2. CI 至少拆成 repo-global / package / heavy 三类 job。

## 13. 推荐推进顺序

1. 先做 `turbo.json + 根脚本` 的 Phase 1。
2. 再做核心包 scripts 下沉。
3. 再做 TS project references。
4. 最后补 affected planner 与 CI matrix。

这个顺序的好处是：

1. 每一步都能带来真实收益。
2. 每一步都不要求 big-bang 重构。
3. 即使只完成前两步，也能拿到明显的本地/CI 提速效果。
