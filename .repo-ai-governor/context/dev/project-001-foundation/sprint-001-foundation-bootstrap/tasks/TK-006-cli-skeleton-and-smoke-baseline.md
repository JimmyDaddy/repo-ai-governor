# TK-006 CLI 命令骨架与 smoke 基线

- Status: completed
- Date: 2026-03-19
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-001-foundation-bootstrap`

## 1. 任务目标

完成 `init/doctor/check/run/review/review-verify/plan/upgrade` 命令骨架，并前置落地 `packages/shared/src/i18n` 的 `i18next` runtime 基线与最小 smoke 验证链路。

## 2. Depends On

1. `TK-005`
2. `DA-003`
3. `DA-004`
4. `DA-005`
5. `DA-006`

## 3. 预期产物

1. `DA-007` CLI skeleton baseline 文档。
2. `DA-008` shared i18n runtime baseline 文档。
3. `DA-009` 命令 smoke 验证清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md` (`DA-004`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md` (`DA-005`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md` (`DA-006`)

## 5. 实施摘要

1. 落地 CLI 命令骨架：
   - 新建 `apps/cli/src/main.ts`，统一承载 8 个 Stage 1 命令。
   - 新建 `apps/cli/src/constants/cli-command.constant.ts`，集中管理有限命令集合。
   - `bin/repo-ai-governor.ts` 改为应用层入口转发，避免命令逻辑散落在 bin 层。
2. 落地 shared i18n runtime：
   - 新建 `packages/shared/src/i18n/i18n-runtime.ts` 与 `locales/zh-cn.ts`,`locales/en-us.ts`。
   - 固化 `initialize/resolveLocale/t/formatMessage` 四个 API。
   - 关闭 i18next support notice，保证 CLI 输出稳定。
3. 补齐最小 smoke 验证链路：
   - 新增 `test/cli-skeleton.smoke.test.ts` 与 `test/i18n-runtime.smoke.test.ts`。
   - 通过 `pnpm run build` + dist CLI 命令调用 + `pnpm run test` + `pnpm run check` 完成闭环验证。

## 6. 产出

1. `apps/cli/package.json`
2. `apps/cli/README.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/constants/cli-command.constant.ts`
5. `packages/shared/package.json`
6. `packages/shared/README.md`
7. `packages/shared/src/index.ts`
8. `packages/shared/src/i18n/index.ts`
9. `packages/shared/src/i18n/i18n-runtime.ts`
10. `packages/shared/src/i18n/locales/zh-cn.ts`
11. `packages/shared/src/i18n/locales/en-us.ts`
12. `test/cli-skeleton.smoke.test.ts`
13. `test/i18n-runtime.smoke.test.ts`
14. `DA-007` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-cli-skeleton-baseline.md`
15. `DA-008` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md`
16. `DA-009` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md`

## 7. 验证

1. `pnpm run format:check && pnpm run lint && pnpm run build`
2. `node ./dist/bin/repo-ai-governor.js --help`
3. `node ./dist/bin/repo-ai-governor.js init --locale en-US`
4. `node ./dist/bin/repo-ai-governor.js review-verify`
5. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run check`
