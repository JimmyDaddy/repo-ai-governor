/**
 * Defines default CSV file names used by fs-csv memory provider.
 */
export const FS_CSV_RECORDS_FILE_NAME = 'memory-records.csv';
export const FS_CSV_SNAPSHOTS_FILE_NAME = 'memory-snapshots.csv';
export const FS_CSV_ARCHIVE_FILE_NAME = 'memory-archive.csv';
export const FS_CSV_SNAPSHOTS_DIRECTORY_NAME = 'snapshots';

/**
 * Defines records CSV header row.
 */
export const FS_CSV_RECORDS_HEADER = [
  'namespace',
  'key',
  'value_json',
  'tags_json',
  'updated_at',
] as const;

/**
 * Defines snapshots CSV header row.
 */
export const FS_CSV_SNAPSHOTS_HEADER = [
  'snapshot_id',
  'created_at',
  'reason',
  'record_count',
  'snapshot_path',
] as const;

/**
 * Defines archive CSV header row.
 */
export const FS_CSV_ARCHIVE_HEADER = [
  'namespace',
  'key',
  'value_json',
  'tags_json',
  'updated_at',
  'archived_at',
] as const;
