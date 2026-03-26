import type {
  LangGraphCommunityVendorBindingStatus,
  LangGraphCommunityVendorDependencyMode,
  LangGraphCommunityVendorRuntimeKind,
} from "../../constants/index.js";

export type LangGraphCommunityVendorModuleLoader = (moduleSpecifier: string) => Promise<unknown>;

export interface LangGraphCommunityVendorBindingOptions {
  packageName?: string;
  requiredExports?: string[];
  moduleLoader?: LangGraphCommunityVendorModuleLoader;
}

export interface LangGraphCommunityVendorBindingResolution {
  runtimeKind: LangGraphCommunityVendorRuntimeKind;
  packageName: string;
  dependencyMode: LangGraphCommunityVendorDependencyMode;
  bindingStatus: LangGraphCommunityVendorBindingStatus;
  availableExports: string[];
  missingRequiredExports: string[];
  summary: string;
  failureReason?: string;
}
