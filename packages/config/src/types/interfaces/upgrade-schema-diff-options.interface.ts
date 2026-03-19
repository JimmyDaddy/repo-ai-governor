import type { GovernorSchemaVersion } from "../../constants/schema-upgrade.constant.js";
import type { GovernorConfig } from "./governor-config.interface.js";

export interface UpgradeSchemaDiffOptions {
  sourceConfig: GovernorConfig;
  targetVersion?: GovernorSchemaVersion;
}
