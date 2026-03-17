import type { SLOT_CONFLICT_POLICIES } from "../../constants/slot-model.js";

export type SlotConflictPolicy = (typeof SLOT_CONFLICT_POLICIES)[number];
