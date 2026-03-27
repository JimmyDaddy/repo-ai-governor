import type { AuditRecordStatus } from '@repo-ai-governor/core-session';

/**
 * Represents aggregated status counters for one execution or stage report block.
 */
export type ReportStatusBreakdown = Partial<Record<AuditRecordStatus, number>>;
