import type { GovernorConfig } from "./governor-config.interface.js";

export interface ResolvedConfig {
  profileId: string | null;
  config: GovernorConfig;
}
