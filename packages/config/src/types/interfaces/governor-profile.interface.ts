import type { I18nConfig } from "./i18n-config.interface.js";
import type { WorkspaceConfig } from "./workspace-config.interface.js";

export interface GovernorProfile {
  workspace?: Partial<WorkspaceConfig>;
  i18n?: Partial<I18nConfig>;
}
