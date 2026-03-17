import { test } from "vitest";
import assert from "node:assert/strict";
import { cloneValue, normalizeLocale, toRelativePath, translateLocale } from "../../src/utils/common.js";

test("common utils normalize locale with configurable defaults", () => {
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en-US");
  assert.equal(normalizeLocale("unknown"), "zh-CN");
  assert.equal(normalizeLocale("unknown", { defaultLocale: "en-US" }), "en-US");
  assert.equal(translateLocale("unknown", "中文", "English"), "中文");
  assert.equal(
    translateLocale("unknown", "中文", "English", { defaultLocale: "en-US" }),
    "English"
  );
});

test("common utils provide relative path and clone helpers", () => {
  assert.equal(toRelativePath("/tmp/repo", "/tmp/repo/docs/plan.md"), "docs/plan.md");

  const source = { nested: { value: 1 } };
  const cloned = cloneValue(source);
  cloned.nested.value = 2;
  assert.equal(source.nested.value, 1);
});
