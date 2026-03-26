# TK-215 PRD 能力覆盖矩阵与证据基线盘点

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-019-product-gap-assessment`
- Sprint: `sprint-001-current-state-vs-prd-gap-assessment`

## 1. 任务目标

将 PRD 拆成可盘点的能力域，并用当前仓库中的真实实现证据建立 coverage matrix。

## 2. Depends On

1. `TK-214`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 3. 预期产物

1. 一份 capability coverage matrix。
2. 一组证据入口路径（CLI、packages、integrations、README、master plan）。
3. `DA-215`

## 4. 实施计划

1. 按 PRD 能力域拆分盘点维度。
2. 将每个维度映射到真实包、命令、文档或测试资产。
3. 区分“文档宣称完成”和“仓库中可直接观察到的完成”。

## 5. 验证

1. `rg -n "P0|P1|P2|8\\.1|8\\.5|8\\.7|8\\.9|8\\.10" .repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `find packages -mindepth 2 -maxdepth 2 -name package.json | sort`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始对齐 PRD、master plan、CLI/runtime/adapters/packages/README。
3. 2026-03-26：已完成 capability coverage matrix 与 evidence baseline，形成 `DA-215`。
