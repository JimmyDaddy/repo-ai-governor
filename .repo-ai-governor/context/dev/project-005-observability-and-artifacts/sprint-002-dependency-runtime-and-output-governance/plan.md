# sprint-002-dependency-runtime-and-output-governance 计划

- Status: completed
- Date: 2026-03-22
- Project: `project-005-observability-and-artifacts`

## 1. Sprint Goal

完成 Stage 6 后半段执行基线，输出 CLI 输出契约、i18n 输出门禁与审计隐私治理，并补齐 artifact registry 在执行态与 triad 文档中的单一事实源收敛。

## 2. In-Scope Tasks

1. TK-050 CLI 输出契约与 non-TTY 自动降级基线（completed）
2. TK-051 i18n parity/fallback 门禁与 output_locale 回放定位基线（completed）
3. TK-052 审计隐私治理（保留/脱敏/导出删除）基线（completed）
4. TK-053 project-005 出口验收与 project-006 输入约束（completed）
5. TK-054 Artifact Registry 单一事实源与人类视图收敛（completed）
6. TK-055 Artifact Registry triad canonical-source 同步（completed）

## 3. Entry Criteria

1. `DA-060`（sprint-001 出口验收基线）与 `DA-061`（sprint-002 输入约束清单）可检索。
2. Stage 6 前半段产物（`DA-057`~`DA-059`）具备可消费语义。

## 4. Exit Criteria

1. CLI 三模式输出与 non-TTY 自动降级策略形成稳定契约。
2. i18n parity/fallback 门禁与隐私治理形成可回放、可审计、可处置能力。
3. Artifact Registry 人类可读访问不再依赖手工维护的 registry 镜像。
4. PRD / brief / overall / architecture 对 Artifact Registry canonical source 与 rendered view 口径保持同步。
5. 形成 `DA-065`（project-005 出口验收）与 `DA-066`（project-006 输入约束）。
