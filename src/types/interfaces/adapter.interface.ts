import type {
  AdapterEntrypoint,
  AdapterInjectionMode,
  AdapterInjectionSource,
  AdapterInputSource,
  AdapterOutputArtifact,
  AdapterProtocol,
  AdapterRequiredView,
  AdapterSupportedFormat,
  AdapterType,
} from "../aliases/adapter.type.js";
import type { Locale } from "../aliases/locale.type.js";

export interface LocalizedText extends Record<Locale, string> {}

export interface AdapterDefinition {
  id: string;
  version: "1";
  type: AdapterType;
  enabled?: boolean;
  meta: {
    name?: LocalizedText;
    provider?: string;
    description?: LocalizedText;
  };
  targets: {
    products: string[];
    entrypoints: AdapterEntrypoint[];
    protocols: AdapterProtocol[];
  };
  capabilities: {
    promptInjection: boolean;
    structuredOutput: boolean;
    toolCalling: boolean;
    fileSystemAccess: boolean;
    terminalAccess: boolean;
    patchEditing: boolean;
    approvalControl: boolean;
    [key: string]: boolean;
  };
  contract: {
    input: {
      sources: AdapterInputSource[];
      requiredViews: AdapterRequiredView[];
      supportedFormats: AdapterSupportedFormat[];
    };
    output: {
      artifactKinds: AdapterOutputArtifact[];
      supportedFormats: AdapterSupportedFormat[];
      supportsReviewLifecycle: boolean;
    };
  };
  injection: {
    mode: AdapterInjectionMode;
    sources: AdapterInjectionSource[];
    promptSections: AdapterInjectionSource[];
    templateVariables: string[];
  };
}
