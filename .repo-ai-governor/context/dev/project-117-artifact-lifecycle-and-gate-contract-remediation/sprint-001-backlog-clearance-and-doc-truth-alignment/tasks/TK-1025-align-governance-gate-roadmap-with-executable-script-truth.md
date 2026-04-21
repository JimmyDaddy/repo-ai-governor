# TK-1025 align governance gate roadmap with executable script truth

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-117-artifact-lifecycle-and-gate-contract-remediation`
- Sprint: `sprint-001-backlog-clearance-and-doc-truth-alignment`

## 1. 任务目标

把治理文档中关于 monorepo naming / versioning / god-object boundary 脚本的 prepared/planned 口径收口到与仓库真实脚本存在性一致的状态。

## 2. Depends On

1. `TK-1023`

## 3. 预期产物

1. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 4. Required Inputs

1. .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md
2. .repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md
3. package.json
4. scripts/governance/check-package-dependency-boundary.js

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/plan.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/repo-ai-governor-current-improvement-priorities-and-governance-remediation-refresh.md

## 6. 实施计划

1. 盘点文档中声称存在或 prepared 的治理脚本，与 `scripts/governance/**` 真实文件比对。
2. 将口径改成“规则存在、脚本待实现/待激活”或“仅当前已有 dependency-boundary warning 模式脚本落地”。
3. 运行 relevant docs/gate checks，确保收口后不再产生新的规范漂移。

## 7. Development Verification

1. node ./scripts/governance/run-normative-loading-manifest-gate.js
2. node ./scripts/governance/check-docs-triad-sync.js

## 8. Delivery Verification

1. node ./scripts/governance/run-normative-loading-manifest-gate.js
2. pnpm run check（已执行；若仍失败，仅允许保留为 scope 外 dirty-worktree drift，并需在执行记录中明确指出）

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。
2. 2026-04-21：已完成 `code_standards.md` 与 `long-term-maintenance-guide.md` 的 missing-script truth alignment；两份文档现在明确区分“规则已定义但 checker script 未创建”和“已真实落地的 gate script”。
3. 2026-04-21：`run-normative-loading-manifest-gate.js` 已通过。`pnpm run check` 当前剩余失败仅来自 scope 外 dirty worktree 中的 biome format drift，不再来自本任务修复面。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
