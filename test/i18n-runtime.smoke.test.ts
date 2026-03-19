import { describe, expect, it } from "vitest";

import { I18nRuntime } from "../packages/shared/src/index.js";

describe("I18nRuntime smoke", () => {
  it("resolves locale by language fallback and renders localized message", async () => {
    const runtime = new I18nRuntime();

    const resolvedLocale = await runtime.initialize(
      {
        runtimeEngine: "i18next",
        defaultLocale: "zh-CN",
        fallbackLocale: "en-US",
        supportedLocales: ["zh-CN", "en-US"],
      },
      "zh-TW",
    );

    expect(resolvedLocale).toBe("zh-CN");
    expect(runtime.t("cli.commands.init.description")).toContain("初始化");
  });
});
