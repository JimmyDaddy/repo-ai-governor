import type { UpgradeSchemaDiffType } from "../../constants/schema-upgrade.constant.js";

export interface UpgradeSchemaDiffItem {
  path: string;
  diffType: UpgradeSchemaDiffType;
  reason: string;
  fromValue?: unknown;
  toValue?: unknown;
}
