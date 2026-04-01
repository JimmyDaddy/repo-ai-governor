const EXECUTION_DETAIL_TIMESTAMP_PATTERN = /^\[(\d{2}:\d{2}:\d{2})\]\s+(.*)$/u;

/**
 * Formats one execution-detail line with a stable `HH:MM:SS` timestamp prefix.
 * @param content Human-readable detail content.
 * @param occurredAt Optional event time source.
 * @returns Timestamped detail line.
 */
export function createTimestampedExecutionDetailLine(
  content: string,
  occurredAt?: string | Date,
): string {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return '';
  }

  const resolvedDate =
    occurredAt instanceof Date
      ? occurredAt
      : typeof occurredAt === 'string'
        ? new Date(occurredAt)
        : new Date();
  const timestamp = Number.isNaN(resolvedDate.getTime()) ? new Date() : resolvedDate;

  return `[${formatExecutionDetailTime(timestamp)}] ${normalizedContent}`;
}

/**
 * Splits one execution-detail line into timestamp and content segments for richer rendering.
 * @param line Raw persisted detail line.
 * @returns Parsed timestamp label plus content.
 */
export function parseTimestampedExecutionDetailLine(line: string): {
  timestamp: string | null;
  content: string;
} {
  const normalizedLine = line.trim();
  const matchedTimestamp = normalizedLine.match(EXECUTION_DETAIL_TIMESTAMP_PATTERN);
  if (!matchedTimestamp) {
    return {
      timestamp: null,
      content: normalizedLine,
    };
  }

  return {
    timestamp: matchedTimestamp[1] ?? null,
    content: matchedTimestamp[2] ?? normalizedLine,
  };
}

function formatExecutionDetailTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
