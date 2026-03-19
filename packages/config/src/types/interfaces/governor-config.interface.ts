import type { GovernorProfile } from "./governor-profile.interface.js";
import type { I18nConfig } from "./i18n-config.interface.js";
import type { WorkspaceConfig } from "./workspace-config.interface.js";

export interface GovernorConfig {
  schemaVersion: string;
  workspace: WorkspaceConfig;
  i18n: I18nConfig;
  activeProfile?: string;
  profiles?: Record<string, GovernorProfile>;
}
