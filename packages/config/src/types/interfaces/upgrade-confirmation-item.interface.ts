import type { UpgradeConfirmationReason } from "../../constants/schema-upgrade.constant.js";

export interface UpgradeConfirmationItem {
  reason: UpgradeConfirmationReason;
  message: string;
  paths: string[];
  blocking: boolean;
}
