# DA-211 core-runtime-langgraph direct dependency cutover and vendor binding contract alignment

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-211`
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. Summary

1. `packages/core-runtime-langgraph/package.json` 已将 `@langchain/langgraph` 从 `optional peer` 切换为 direct dependency。
2. `pnpm-lock.yaml` 已补入 `packages/core-runtime-langgraph` importer 与 `@langchain/langgraph@1.x` 的锁定版本。
3. `LangGraphCommunityVendorBinding` 的 resolution contract 已从 `isOptionalPeerDependency` 语义收敛为 bundled dependency contract verification。

## 2. Key Outputs

1. [package.json](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/package.json)
2. [pnpm-lock.yaml](/Users/jimmydaddy/study/ai-governor/pnpm-lock.yaml)
3. [langgraph-community-vendor-binding.ts](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/src/langgraph-community-vendor-binding.ts)
4. [langgraph-vendor-binding.interface.ts](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/src/types/interfaces/langgraph-vendor-binding.interface.ts)
5. [langgraph-community-vendor-binding.unit.test.ts](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/test/langgraph-community-vendor-binding.unit.test.ts)

## 3. Follow-Up Constraints

1. `module_missing` 仍保留为 fail-closed 诊断路径，但它现在代表异常安装/分发损坏，而不是正常的 optional peer 缺失场景。
