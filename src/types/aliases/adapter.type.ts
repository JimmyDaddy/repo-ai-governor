import type {
  ADAPTER_ENTRYPOINTS,
  ADAPTER_INJECTION_MODES,
  ADAPTER_INJECTION_SOURCES,
  ADAPTER_INPUT_SOURCES,
  ADAPTER_OUTPUT_ARTIFACTS,
  ADAPTER_PROTOCOLS,
  ADAPTER_REQUIRED_VIEWS,
  ADAPTER_SUPPORTED_FORMATS,
  ADAPTER_TYPES,
  MAINSTREAM_ADAPTER_IDS,
} from "../../constants/adapter-model.js";
import type { AdapterDefinition } from "../interfaces/adapter.interface.js";

export type AdapterInputSource = (typeof ADAPTER_INPUT_SOURCES)[number];

export type AdapterOutputArtifact = (typeof ADAPTER_OUTPUT_ARTIFACTS)[number];

export type MainstreamAdapterId = (typeof MAINSTREAM_ADAPTER_IDS)[number];

export type AdapterType = (typeof ADAPTER_TYPES)[number];

export type AdapterEntrypoint = (typeof ADAPTER_ENTRYPOINTS)[number];

export type AdapterProtocol = (typeof ADAPTER_PROTOCOLS)[number];

export type AdapterRequiredView = (typeof ADAPTER_REQUIRED_VIEWS)[number];

export type AdapterSupportedFormat = (typeof ADAPTER_SUPPORTED_FORMATS)[number];

export type AdapterInjectionMode = (typeof ADAPTER_INJECTION_MODES)[number];

export type AdapterInjectionSource = (typeof ADAPTER_INJECTION_SOURCES)[number];

export type AdapterPresetMap = Record<MainstreamAdapterId, Readonly<AdapterDefinition>>;
