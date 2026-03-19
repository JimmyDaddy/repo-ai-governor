# TK-005 Config 包基线实现方案

- Status: completed
- Date: 2026-03-19
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-001-foundation-bootstrap`

## 1. 任务目标

形成 `packages/config` 的最小契约基线：`Config Loader`、`Schema Validator`、`Profile Resolver`。

## 2. Depends On

1. `TK-004`
2. `DA-003`
3. `DA-004`

## 3. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md` (`DA-004`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 4. 实施摘要

1. 落地 `packages/config` 最小实现骨架：
   - `ConfigLoader`：YAML 文件加载并接入 schema 校验；
   - `SchemaValidator`：基于内置契约规则的结构化配置校验；
   - `ProfileResolver`：`requestedProfileId/activeProfile` 合并解析。
2. 按命名与类型治理约束建立类型目录：
   - `src/types/interfaces/*.interface.ts`
   - `src/types/aliases/*.type.ts`
3. 补齐 `packages/config/README.md` 的 CLI 消费约定，明确后续 `apps/cli` 接口调用顺序。
4. 产出可复用契约文档并登记 `DA-005`。

## 5. 产出

1. `packages/config/package.json`
2. `packages/config/README.md`
3. `packages/config/src/index.ts`
4. `packages/config/src/config-loader.ts`
5. `packages/config/src/schema-validator.ts`
6. `packages/config/src/profile-resolver.ts`
7. `DA-005` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md`
8. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-esm-relative-import-extension-options.md`（讨论稿）
9. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md`（选型结论稿）

## 6. 验证

1. `packages/config` 已具备 loader/schema/profile 三类契约入口且可被后续 CLI 直接导入。
2. `DA-005` 已登记到 dependency artifact registry 并对后续任务建立回链依赖。
3. 本地质量门禁验证通过：`PATH=/opt/homebrew/bin:$PATH npm run check`。
