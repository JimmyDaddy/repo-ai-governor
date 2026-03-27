import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from "../constants/index.js";
import type { StandardsPack } from "../types/index.js";

/**
 * Provides one minimal reusable governance pack for Python adopters.
 */
export const pythonMinimalGovernancePack: StandardsPack = {
  packId: "pack.official.python.minimal",
  packVersion: "1.0.0",
  packSource: StandardsPackSource.OFFICIAL,
  scope: StandardsPackScope.GLOBAL,
  mergePrecedence: 10,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: "rule.python.project.pyproject",
      semanticKey: "rule.python.project.pyproject",
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        "zh-CN": {
          [StandardsRenderTarget.HUMAN]:
            "Python 项目应以 `pyproject.toml` 作为依赖、lint、type-check 与测试配置的主入口。",
          [StandardsRenderTarget.AI]:
            "Use `pyproject.toml` as the canonical Python config for dependencies, lint, type checks, and tests.",
          [StandardsRenderTarget.AGENTS]:
            "Treat `pyproject.toml` as the canonical Python governance config.",
        },
        "en-US": {
          [StandardsRenderTarget.HUMAN]:
            "Use `pyproject.toml` as the canonical entry for dependency, lint, type-check, and test configuration.",
          [StandardsRenderTarget.AI]:
            "Use `pyproject.toml` as the canonical Python config for dependencies, lint, type checks, and tests.",
          [StandardsRenderTarget.AGENTS]:
            "Treat `pyproject.toml` as the canonical Python governance config.",
        },
      },
    },
    {
      ruleId: "rule.python.lint.ruff",
      semanticKey: "rule.python.lint.ruff",
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        "zh-CN": {
          [StandardsRenderTarget.HUMAN]:
            "交付前执行 `ruff format .` 与 `ruff check .`，保持格式化与静态检查一致。",
          [StandardsRenderTarget.AI]:
            "Run `ruff format .` and `ruff check .` before delivery.",
          [StandardsRenderTarget.AGENTS]:
            "Require `ruff format .` and `ruff check .` before delivery.",
        },
        "en-US": {
          [StandardsRenderTarget.HUMAN]:
            "Run `ruff format .` and `ruff check .` before delivery to keep formatting and lint consistent.",
          [StandardsRenderTarget.AI]:
            "Run `ruff format .` and `ruff check .` before delivery.",
          [StandardsRenderTarget.AGENTS]:
            "Require `ruff format .` and `ruff check .` before delivery.",
        },
      },
    },
    {
      ruleId: "rule.python.test.pytest",
      semanticKey: "rule.python.test.pytest",
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        "zh-CN": {
          [StandardsRenderTarget.HUMAN]:
            "最小回归测试基线使用 `pytest`；修改行为时需补齐对应测试。",
          [StandardsRenderTarget.AI]:
            "Use `pytest` for regression coverage and add tests for changed behavior.",
          [StandardsRenderTarget.AGENTS]:
            "Run `pytest` and backfill regression coverage for changed behavior.",
        },
        "en-US": {
          [StandardsRenderTarget.HUMAN]:
            "Use `pytest` as the minimal regression baseline and add tests for changed behavior.",
          [StandardsRenderTarget.AI]:
            "Use `pytest` for regression coverage and add tests for changed behavior.",
          [StandardsRenderTarget.AGENTS]:
            "Run `pytest` and backfill regression coverage for changed behavior.",
        },
      },
    },
    {
      ruleId: "rule.python.types.pyright",
      semanticKey: "rule.python.types.pyright",
      severity: StandardsRuleSeverity.RECOMMENDED,
      enabled: true,
      localizedTemplates: {
        "zh-CN": {
          [StandardsRenderTarget.HUMAN]:
            "推荐在交付前执行 `pyright`（或团队等价工具）收敛类型回归。",
          [StandardsRenderTarget.AI]:
            "Prefer `pyright` or one team-approved equivalent before delivery to catch typing regressions.",
          [StandardsRenderTarget.AGENTS]:
            "Prefer `pyright` or one team-approved equivalent before delivery.",
        },
        "en-US": {
          [StandardsRenderTarget.HUMAN]:
            "Prefer `pyright` or one team-approved equivalent before delivery to catch typing regressions.",
          [StandardsRenderTarget.AI]:
            "Prefer `pyright` or one team-approved equivalent before delivery to catch typing regressions.",
          [StandardsRenderTarget.AGENTS]:
            "Prefer `pyright` or one team-approved equivalent before delivery.",
        },
      },
    },
  ],
};
