import { test } from "vitest";
import assert from "node:assert/strict";
import {
  listRulesForConsumer,
  OFFICIAL_BASE_PACKAGE_RULES,
  OFFICIAL_BASE_STANDARDS_PACKAGE,
  renderRulesForConsumer,
  resolveStandardsPackage
} from "../../src/standards/official-base-package.js";
import { STANDARDS_CATEGORIES } from "../../src/standards/package-model.js";

test("official base standards package ships rule content across all categories", () => {
  const categories = new Set(OFFICIAL_BASE_STANDARDS_PACKAGE.rules.map((rule) => rule.category));

  assert.ok(OFFICIAL_BASE_PACKAGE_RULES.length >= STANDARDS_CATEGORIES.length);

  for (const category of STANDARDS_CATEGORIES) {
    assert.equal(categories.has(category), true);
  }

  assert.equal(OFFICIAL_BASE_STANDARDS_PACKAGE.meta.preset, "official/base");
  assert.equal(OFFICIAL_BASE_STANDARDS_PACKAGE.rules.length, OFFICIAL_BASE_PACKAGE_RULES.length);
});

test("resolveStandardsPackage returns the official package and keeps locale overrides", () => {
  const standardsPackage = resolveStandardsPackage({
    preset: "official/base",
    locales: {
      default: "en-US",
      supported: ["zh-CN", "en-US"]
    }
  });

  assert.equal(standardsPackage.locales.default, "en-US");
  assert.ok(standardsPackage.rules.length > 0);
});

test("listRulesForConsumer and renderRulesForConsumer expose plan-facing standards", () => {
  const planRules = listRulesForConsumer(OFFICIAL_BASE_STANDARDS_PACKAGE, "plan");
  const humanRules = renderRulesForConsumer(OFFICIAL_BASE_STANDARDS_PACKAGE, "plan", {
    view: "human",
    locale: "zh-CN"
  });
  const aiRules = renderRulesForConsumer(OFFICIAL_BASE_STANDARDS_PACKAGE, "check", {
    view: "ai",
    locale: "en-US"
  });

  assert.ok(planRules.length >= 4);
  assert.ok(humanRules.some((rule) => rule.summary.includes("方案")));
  assert.ok(aiRules.some((rule) => rule.instruction.includes("record")));
});

test("resolveStandardsPackage rejects unsupported presets", () => {
  assert.throws(
    () => resolveStandardsPackage({ preset: "custom/base" }),
    /Unsupported standards preset/
  );
});
