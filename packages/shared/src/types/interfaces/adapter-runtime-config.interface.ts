import type { AdapterProviderKind, AdapterVendorBindingKind } from '../../constants/index.js';

/**
 * Defines one transport-aware remote-api config row shared by config and runtime adapters.
 */
export interface AdapterRemoteApiConfig {
  provider: AdapterProviderKind;
  vendorBinding?: AdapterVendorBindingKind;
  model: string;
  credentialEnvVar?: string;
  credentialRef?: string;
  endpoint?: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
}
