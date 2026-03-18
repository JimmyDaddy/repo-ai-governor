import type { REVIEW_STATUSES } from "../../constants/repository-layout.js";

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
