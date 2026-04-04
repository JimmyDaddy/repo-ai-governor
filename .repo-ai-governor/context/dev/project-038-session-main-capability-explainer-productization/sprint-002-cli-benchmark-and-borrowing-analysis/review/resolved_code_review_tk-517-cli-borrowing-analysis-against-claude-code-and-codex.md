# Code Review: CLI borrowing analysis against Claude Code and Codex

- Status: resolved
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `TK-517`
- Review Type: targeted document review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`

## 2. Findings

### 2.1 [P1] Claude Code benchmark source lacks provenance disclaimer

- 位置: `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md:6`
- 问题描述: 报告将 `/Users/jimmydaddy/study/claude-code` 直接列为 benchmark repo，并在后文将其能力作为借鉴依据，但没有说明该对比样本本身在 `README.md` 中自述为 “leaked from Anthropic's npm registry on 2026-03-31”。这会让读者把后续结论误解为来自稳定、官方、可长期复查的上游实现。
- 影响: 一旦后续把这份 draft 提升为正式方案或作为优先级输入，Claude Code 侧的借鉴结论会携带来源可信度与合规边界不清的问题，影响方案审阅与后续复核。
- 建议: 在 benchmark source 一节显式补充来源性质与可信度说明，并把所有基于 Claude Code 的结论标记为“本地样本观察”或补充官方文档/公开行为证据做交叉校验。

### 2.2 [P2] Benchmark evidence is machine-local and unpinned, so the analysis is not reproducible

- 位置: `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md:6`
- 问题描述: 报告只记录了 `/Users/jimmydaddy/...` 形式的本机绝对路径与文件列表，没有记录 benchmark repo 的 commit SHA、采样时间或可复查的版本锚点。对于 `claude-code`、`codex` 这类快速演进的外部代码库，这意味着后续读者无法区分“报告观点本身变化”与“上游样本已漂移”。
- 影响: 这份 benchmark 很难被团队其他成员复核，也难以在后续 sprint 中稳定复用；一旦样本仓库更新，draft 里的 borrowable priority 可能悄悄过时却没有显式信号。
- 建议: 在文首新增 benchmark corpus 小节，至少记录 repo 标识、commit SHA、采样日期，并把“本机工作副本路径”与“可复查版本锚点”分开表达；如果要长期保留在仓库内，避免将绝对用户目录作为唯一证据索引。

## 3. Notes

1. 我对报告中涉及 `Codex` 的 app-server、fork、archive、rollback、compact、alternate-screen 与 request-user-input 结论做了抽样核对，抽样范围内未发现同等级别的事实性偏差。
2. 本次为 docs-only review；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required。

## 4. Verification

1. `git -C /Users/jimmydaddy/study/codex rev-parse HEAD`（通过）
2. `git -C /Users/jimmydaddy/study/claude-code rev-parse HEAD`（通过）
3. `rg -n "\barchive\b|\bfork\b|\brollback\b|\bcompact\b|thread/list|thread/start|thread/resume|app-server" /Users/jimmydaddy/study/codex/codex-rs /Users/jimmydaddy/study/codex/docs -g '*.rs' -g '*.md'`（通过）
4. `rg -n "\bvoice\b|\bbuddy\b|team memory|sharing|bridge" /Users/jimmydaddy/study/claude-code -g '*.ts' -g '*.tsx' -g '*.md'`（通过）

## 复核结论（2026-04-04）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Claude Code benchmark source lacks provenance disclaimer`
   - 判定：**认可**
   - 证据：`/Users/jimmydaddy/study/claude-code/README.md` 明确自述该仓库为 `Claude Code — Leaked Source (2026-03-31)`；原 draft 只列 benchmark repo 与局部代码入口，没有披露样本来源性质与可信度边界。
   - 处理：已在 draft 新增 `Benchmark Corpus 与证据边界` 小节，并声明后文所有 `Claude Code` 判断均按“本地样本观察”处理；若后续提升为正式 technical solution 输入，需补官方或公开可复查资料交叉校验。
2. `2.2 [P2] Benchmark evidence is machine-local and unpinned, so the analysis is not reproducible`
   - 判定：**认可**
   - 证据：原 draft 仅记录本机绝对路径，没有记录 benchmark repo 的 commit SHA 与 sampled date。
   - 处理：已在 draft 为 `claude-code` 与 `codex` 补充 sampled commit、sampled date，并把“本机 worktree 路径”与“可复查版本锚点”拆开表达。

### 验证命令
1. `git -C /Users/jimmydaddy/study/claude-code rev-parse HEAD`（通过）
2. `git -C /Users/jimmydaddy/study/codex rev-parse HEAD`（通过）
3. `sed -n '1,80p' .repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`（通过）

## 修复执行记录（2026-04-04）

1. `2.1 [P1] Claude Code benchmark source lacks provenance disclaimer`：已完成
   - 变更文件：`.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
   - 验证：`rg -n "Leaked Source|本地样本观察|交叉校验" .repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`（通过）
   - 说明：已补来源性质、可信度边界和正式化前的交叉校验要求。
2. `2.2 [P2] Benchmark evidence is machine-local and unpinned, so the analysis is not reproducible`：已完成
   - 变更文件：`.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
   - 验证：`rg -n "sampled commit|sampled date|可复查锚点" .repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`（通过）
   - 说明：已补 benchmark corpus 与复查锚点，避免绝对用户目录成为唯一证据索引。
