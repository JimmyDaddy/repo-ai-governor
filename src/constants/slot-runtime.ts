import { SlotSourceEnum } from "./slot-model.js";

export enum SlotSourcePriorityRankEnum {
  ProjectLocal = 3,
  TeamShared = 2,
  Official = 1,
}

export const SOURCE_PRIORITY = Object.freeze({
  [SlotSourceEnum.ProjectLocal]: SlotSourcePriorityRankEnum.ProjectLocal,
  [SlotSourceEnum.TeamShared]: SlotSourcePriorityRankEnum.TeamShared,
  [SlotSourceEnum.Official]: SlotSourcePriorityRankEnum.Official,
} as const);
