import assert from "node:assert/strict";
import { test } from "vitest";
import {
  OFFICIAL_BASE_PACKAGE_SKELETON,
  STANDARDS_CATEGORIES,
  createStandardsRule,
  groupRulesByCategory,
  listStandardsCategoryIds,
  renderRuleView,
  validateStandardsPackage,
} from "../../src/standards/package-model.js";

test("official standards package skeleton exposes all required categories", () => {
  assert.deepEqual(listStandardsCategoryIds(OFFICIAL_BASE_PACKAGE_SKELETON), STANDARDS_CATEGORIES);
  assert.equal(OFFICIAL_BASE_PACKAGE_SKELETON.meta.preset, "official/base");
  assert.equal(OFFICIAL_BASE_PACKAGE_SKELETON.rules.length, 0);
});

test("createStandardsRule and renderRuleView provide AI and human consumable shapes", () => {
  const rule = createStandardsRule({
    id: "commit-message-required",
    category: "engineering",
    level: "required",
    title: {
      "zh-CN": "提交信息必须规范",
      "en-US": "Commit Messages Must Be Conventional",
    },
    statement: {
      "zh-CN": "提交信息应使用 Conventional Commit。",
      "en-US": "Commit messages should use Conventional Commits.",
    },
    consumers: ["plan", "review"],
    automation: {
      blockOnViolation: true,
      severity: "error",
      stages: ["review"],
    },
    views: {
      ai: {
        instruction: {
          "zh-CN": "生成提交信息时使用 Conventional Commit 格式。",
          "en-US": "Use Conventional Commit format when generating commit messages.",
        },
        verification: {
          "zh-CN": "检查提交信息是否符合 type(scope): subject。",
          "en-US": "Verify the commit message follows type(scope): subject.",
        },
      },
      human: {
        summary: {
          "zh-CN": "提交信息必须遵循 Conventional Commit。",
          "en-US": "Commit messages must follow Conventional Commits.",
        },
        rationale: {
          "zh-CN": "这样便于发布与变更归类。",
          "en-US": "This keeps releases and change logs consistent.",
        },
      },
    },
  });

  const aiView = renderRuleView(rule, { view: "ai", locale: "en-US" });
  const humanView = renderRuleView(rule, { view: "human", locale: "zh-CN" });

  assert.equal(
    (aiView as any).instruction,
    "Use Conventional Commit format when generating commit messages.",
  );
  assert.equal((aiView as any).blockOnViolation, true);
  assert.equal((humanView as any).summary, "提交信息必须遵循 Conventional Commit。");
  assert.equal((humanView as any).rationale, "这样便于发布与变更归类。");
});

test("groupRulesByCategory groups rules under the modeled standards categories", () => {
  const standardsPackage = validateStandardsPackage({
    ...structuredClone(OFFICIAL_BASE_PACKAGE_SKELETON),
    rules: [
      createStandardsRule({
        id: "task-record-required",
        category: "process",
        level: "required",
        title: {
          "zh-CN": "任务记录必须回写",
          "en-US": "Task Records Must Be Updated",
        },
        statement: {
          "zh-CN": "完成实现后必须回写 checklist 和 CSV。",
          "en-US": "Checklist and CSV must be updated after implementation.",
        },
        consumers: ["plan", "review-verify"],
        views: {
          ai: {
            instruction: {
              "zh-CN": "在完成复核后更新 checklist 和 tasks.csv。",
              "en-US": "Update checklist and tasks.csv after verification.",
            },
          },
          human: {
            summary: {
              "zh-CN": "复核后必须更新任务记录。",
              "en-US": "Task records must be updated after verification.",
            },
          },
        },
      }),
    ],
  });

  const grouped = groupRulesByCategory(standardsPackage);

  assert.equal(grouped.find((entry) => entry.id === "process")?.rules.length, 1);
  assert.equal(grouped.find((entry) => entry.id === "code")?.rules.length, 0);
});
