import { GovernorError, GovernorErrorCode } from "@repo-ai-governor/shared";
import { LangGraphCommunityVendorBinding } from "../src/index.js";

describe("LangGraphCommunityVendorBinding", () => {
  it("returns available when the bundled vendor package exposes required exports", async () => {
    const binding = new LangGraphCommunityVendorBinding({
      moduleLoader: async () => ({
        StateGraph: class StateGraph {},
        START: "__start__",
        END: "__end__",
      }),
    });

    const resolution = await binding.resolve();

    expect(resolution.bindingStatus).toBe("available");
    expect(resolution.missingRequiredExports).toEqual([]);
    expect(resolution.availableExports).toEqual(["END", "START", "StateGraph"]);
    expect(resolution.dependencyMode).toBe("direct_dependency");
  });

  it("returns module_missing when the bundled vendor package is unexpectedly unavailable", async () => {
    const binding = new LangGraphCommunityVendorBinding({
      moduleLoader: async () => {
        const error = new GovernorError(
          GovernorErrorCode.UNKNOWN,
          "Cannot find package '@langchain/langgraph'",
        );
        Object.assign(error as unknown as { code: string }, {
          code: "ERR_MODULE_NOT_FOUND",
        });
        throw error;
      },
    });

    const resolution = await binding.resolve();

    expect(resolution.bindingStatus).toBe("module_missing");
    expect(resolution.failureReason).toBe("module_missing:@langchain/langgraph");
    expect(resolution.missingRequiredExports).toEqual(["StateGraph", "START", "END"]);
    expect(resolution.summary).toContain("unexpectedly unavailable");
  });

  it("returns export_missing when the vendor package does not expose the required contract", async () => {
    const binding = new LangGraphCommunityVendorBinding({
      moduleLoader: async () => ({
        StateGraph: class StateGraph {},
      }),
    });

    const resolution = await binding.resolve();

    expect(resolution.bindingStatus).toBe("export_missing");
    expect(resolution.missingRequiredExports).toEqual(["START", "END"]);
  });
});
