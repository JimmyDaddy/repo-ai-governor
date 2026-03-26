import { standardizeError } from "@repo-ai-governor/shared";
import {
  LANGGRAPH_COMMUNITY_VENDOR_DEFAULT_PACKAGE_NAME,
  LANGGRAPH_COMMUNITY_VENDOR_REQUIRED_EXPORTS,
  type LangGraphCommunityVendorBindingStatus,
  type LangGraphCommunityVendorRuntimeKind,
} from "./constants/index.js";
import type {
  LangGraphCommunityVendorBindingOptions,
  LangGraphCommunityVendorBindingResolution,
  LangGraphCommunityVendorModuleLoader,
} from "./types/index.js";

const DEFAULT_RUNTIME_KIND: LangGraphCommunityVendorRuntimeKind = "langchain_langgraph_js";

// dynamic-import-allowed: keep runtime-resolved vendor verification so broken distributions fail closed with explicit diagnostics.
const defaultModuleLoader: LangGraphCommunityVendorModuleLoader = async (moduleSpecifier) =>
  import(moduleSpecifier);

export class LangGraphCommunityVendorBinding {
  private readonly packageName: string;
  private readonly requiredExports: string[];
  private readonly moduleLoader: LangGraphCommunityVendorModuleLoader;

  constructor(options: LangGraphCommunityVendorBindingOptions = {}) {
    this.packageName = options.packageName ?? LANGGRAPH_COMMUNITY_VENDOR_DEFAULT_PACKAGE_NAME;
    this.requiredExports = options.requiredExports
      ? [...options.requiredExports]
      : [...LANGGRAPH_COMMUNITY_VENDOR_REQUIRED_EXPORTS];
    this.moduleLoader = options.moduleLoader ?? defaultModuleLoader;
  }

  public async resolve(): Promise<LangGraphCommunityVendorBindingResolution> {
    try {
      const moduleNamespace = await this.moduleLoader(this.packageName);
      const exportedKeys = this.collectExportedKeys(moduleNamespace);
      const missingRequiredExports = this.requiredExports.filter(
        (exportName) => !exportedKeys.includes(exportName),
      );

      if (missingRequiredExports.length > 0) {
        return this.createResolution("export_missing", exportedKeys, missingRequiredExports, {
          failureReason: `missing_required_exports:${missingRequiredExports.join("|")}`,
        });
      }

      return this.createResolution("available", exportedKeys, []);
    } catch (error) {
      const standardizedError = standardizeError(error);
      if (this.isModuleMissingFailure(error, standardizedError.message)) {
        return this.createResolution("module_missing", [], [...this.requiredExports], {
          failureReason: `module_missing:${this.packageName}`,
        });
      }

      return this.createResolution("load_failed", [], [...this.requiredExports], {
        failureReason: standardizedError.message,
      });
    }
  }

  private createResolution(
    bindingStatus: LangGraphCommunityVendorBindingStatus,
    availableExports: string[],
    missingRequiredExports: string[],
    options: {
      failureReason?: string;
    } = {},
  ): LangGraphCommunityVendorBindingResolution {
    return {
      runtimeKind: DEFAULT_RUNTIME_KIND,
      packageName: this.packageName,
      dependencyMode: "direct_dependency",
      bindingStatus,
      availableExports,
      missingRequiredExports,
      summary: this.createSummary(bindingStatus, missingRequiredExports),
      ...(options.failureReason ? { failureReason: options.failureReason } : {}),
    };
  }

  private createSummary(
    bindingStatus: LangGraphCommunityVendorBindingStatus,
    missingRequiredExports: string[],
  ): string {
    if (bindingStatus === "available") {
      return `Bundled community vendor package "${this.packageName}" is available.`;
    }
    if (bindingStatus === "module_missing") {
      return `Bundled community vendor package "${this.packageName}" is unexpectedly unavailable in the current installation.`;
    }
    if (bindingStatus === "export_missing") {
      return `Community vendor package "${this.packageName}" is missing required exports: ${missingRequiredExports.join(", ")}.`;
    }
    return `Community vendor package "${this.packageName}" failed to load.`;
  }

  private collectExportedKeys(moduleNamespace: unknown): string[] {
    if (!moduleNamespace || typeof moduleNamespace !== "object") {
      return [];
    }
    return Object.keys(moduleNamespace as Record<string, unknown>).sort();
  }

  private isModuleMissingFailure(error: unknown, detail: string): boolean {
    if (error && typeof error === "object" && "code" in error) {
      const errorCode = (error as { code?: unknown }).code;
      if (errorCode === "ERR_MODULE_NOT_FOUND" || errorCode === "MODULE_NOT_FOUND") {
        return true;
      }
    }

    const normalizedDetail = detail.toLowerCase();
    return (
      normalizedDetail.includes("cannot find package") ||
      normalizedDetail.includes("cannot find module") ||
      normalizedDetail.includes("module not found")
    );
  }
}
