# TK-005 i18n 社区方案对比与本仓库选型结论

- Status: active-discussion
- Date: 2026-03-19
- Scope: `project-001-foundation`（Stage 1 i18n 基线）
- Related:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（i18n Runtime Contract）
  - `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标

1. 给出可选 i18n 社区方案清单与横向对比。
2. 输出“仅针对本仓库”的推荐方案。
3. 给出最小迁移计划与可回滚策略，确保可渐进落地。

## 2. 候选方案

1. `i18next`
2. `typesafe-i18n`
3. `FormatJS (intl-messageformat + CLI)`
4. `Lingui`
5. `messageformat`（作为底层编译器）

## 3. 横向对比

| 方案 | 类型安全 | Node/CLI 适配 | ICU/plural 能力 | 翻译工作流工具 | 迁移复杂度 | 综合评估 |
|---|---|---|---|---|---|---|
| i18next | 中高（可配 selector API） | 高 | 高 | 高（插件生态丰富） | 中 | 生态最稳、通用性强 |
| typesafe-i18n | 高（生成器驱动） | 高 | 中高 | 中（偏代码生成） | 中 | TS-first 团队友好 |
| FormatJS | 中 | 高 | 高（ICU 强） | 高（extract/compile/verify） | 中高 | 复杂文案能力强 |
| Lingui | 中 | 中高 | 高（ICU） | 高（CLI + ESLint + Vite） | 中高 | 前端/翻译流程友好 |
| messageformat | 低（需自建封装） | 高 | 高（ICU 编译） | 中（编译器为主） | 高 | 适合做底层引擎，不宜单独直用 |

评估说明（推断）：

1. `Node/CLI 适配` 结合本仓库“CLI + monorepo + shared 层复用”场景评估。
2. `迁移复杂度` 结合当前 Stage 1 基线（TS + Vitest + Biome + NodeNext ESM）评估。
3. `综合评估` 是面向本仓库当前阶段目标（先稳态落地，再扩展能力）的加权结论。

## 4. 仅针对本仓库的推荐结论

## 4.1 推荐方案（主方案）

推荐采用：`i18next` 作为本仓库 i18n runtime 基线。

推荐理由：

1. 与本仓库“多模块 + 后续 adapter/runtime/reporting 复用”的架构方向匹配。
2. fallback/plural/interpolation 等能力完整，且 Node 侧落地成熟。
3. 插件与生态足够丰富，后续接入语言探测、资源加载、缓存时改造成本更低。
4. 可通过 TypeScript selector API 提升 key 调用类型安全，降低 key 漂移风险。

## 4.2 备选方案（条件触发）

若后续将“编译期 key 类型约束”提升为第一优先级，可切换为 `typesafe-i18n`。

触发条件示例：

1. 对“漏 key/错 key”零容忍且必须在编译期阻断。
2. 团队可接受生成器工作流（base locale 优先、变更后生成类型）。

## 5. 最小迁移计划（以 i18next 为目标）

## 5.1 阶段划分

1. Phase 0（准备）
   - 在 `packages/shared/src/i18n/` 固化入口接口：`resolveLocale`、`t`、`formatMessage`。
   - 保持现有调用方不变，只新增适配层。
2. Phase 1（引入 runtime）
   - 引入 `i18next` 并建立最小初始化器（`zh-CN/en`）。
   - 落地 fallback 解析优先级：`flag > repo config > default`。
3. Phase 2（资源接入）
   - 迁移 CLI 可见文案到 locale 资源；机器可读字段保持稳定，不进入翻译资源。
   - 按语义 key 管理（`domain.stage.message_key`）。
4. Phase 3（校验与门禁）
   - 增加 key parity 检查（`zh-CN` 与 `en` 键集一致）。
   - 增加 fallback 可用性检查（缺键时可回退）。
5. Phase 4（切换）
   - CLI 默认走 i18n runtime；保留短期开关支持回退。
   - 补充 Vitest 用例覆盖 locale/fallback/插值行为。

## 5.2 交付边界

1. 仅本地化“人类可读文案”；`json` 机器字段不本地化。
2. 不在 Phase 1 引入远端翻译平台，避免范围膨胀。
3. 不在本阶段耦合 UI 框架特定方案（例如 React 专属宏）。

## 6. 新仓库实施策略（无回滚链路）

1. 当前仓库处于新仓库起步阶段，i18n 引入采用 `fix-forward`，不单独建设双运行时回滚方案。
2. 如出现文案缺键或 locale 解析问题，按“修复并前进”处理：补齐资源 -> 复跑门禁 -> 正向发布。
3. 仍保留最小安全边界：
   - 机器字段不本地化；
   - key parity 与 fallback 门禁按阶段接入；
   - i18n 初始化失败应直接阻断并输出可定位错误。

## 7. 风险与缓解

1. 风险：key 命名不一致导致维护成本上升。
   - 缓解：强制语义 key 规范 + parity 检查。
2. 风险：CLI 输出中机器字段被误本地化。
   - 缓解：输出 contract 中明确机器字段稳定性，并加测试保护。
3. 风险：迁移期间双实现分叉。
   - 缓解：设置迁移窗口截止点，按里程碑清理 legacy 路径。

## 8. 结论

1. 当前建议：继续保留现有 ESM 扩展名策略，i18n 采用 `i18next` 作为主方案。
2. 迁移原则：小步引入、fix-forward、先 warning 后 blocking。
3. 决策状态：可进入 TK-006/TK-009 作为输入参考，但在正式编码前建议做一次实现前评审确认。

## 9. 参考链接

1. i18next API: https://www.i18next.com/overview/api
2. i18next TypeScript: https://www.i18next.com/overview/typescript
3. i18next Fallback: https://www.i18next.com/principles/fallback
4. i18next Interpolation: https://www.i18next.com/translation-function/interpolation
5. i18next Plurals: https://www.i18next.com/translation-function/plurals
6. FormatJS intl-messageformat: https://formatjs.github.io/docs/intl-messageformat/
7. FormatJS CLI: https://formatjs.github.io/docs/tooling/cli/
8. Lingui: https://lingui.dev/
9. typesafe-i18n: https://typesafe-i18n.pages.dev/
10. messageformat CLI: https://messageformat.github.io/messageformat/cli/
