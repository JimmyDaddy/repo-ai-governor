#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_DELIVERY_REGISTRY_PATH,
  SUPPORTED_TECHNICAL_SOLUTION_CONSUMER_SURFACES,
  SUPPORTED_TECHNICAL_SOLUTION_DELIVERY_MODES,
  SUPPORTED_TECHNICAL_SOLUTION_EXECUTION_STATUSES,
  SUPPORTED_TECHNICAL_SOLUTION_ROLLOUT_STATUSES,
  SUPPORTED_TECHNICAL_SOLUTION_USER_IMPACT_LEVELS,
  buildTechnicalSolutionDeliveryIndex,
  loadTechnicalSolutionDeliveryRegistry,
} from './technical-solution-delivery-registry.js';
import {
  DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH,
  buildTechnicalSolutionLifecycleIndex,
  loadTechnicalSolutionLifecycleRegistry,
} from './technical-solution-lifecycle-registry.js';

const GATE_NAME = 'technical-solution-delivery-registry';
const DEFAULT_CURRENT_CONTEXT_PATH = '.repo-ai-governor/context/current-context.md';
const USER_FACING_CONSUMER_SURFACES = new Set([
  'adopter_cli',
  'packaged_distribution',
  'runtime_service',
  'docs_playbook',
]);
const FOLLOWUP_EXECUTION_STATUSES = new Set(['planned', 'in_progress', 'completed']);
const EXISTING_STREAM_EXECUTION_STATUSES = new Set(['in_progress', 'completed']);
const ACTIVE_STREAM_CONTEXT_STATUSES = new Set(['planned', 'in_progress']);

/**
 * Resolves CLI options.
 * @param {string[]} argv Raw args.
 * @returns {{format: "text" | "json", registryPath: string, lifecycleRegistryPath: string, currentContextPath: string}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json", registryPath: string, lifecycleRegistryPath: string, currentContextPath: string}} */
  const options = {
    format: 'text',
    registryPath: DEFAULT_TECHNICAL_SOLUTION_DELIVERY_REGISTRY_PATH,
    lifecycleRegistryPath: DEFAULT_TECHNICAL_SOLUTION_LIFECYCLE_REGISTRY_PATH,
    currentContextPath: DEFAULT_CURRENT_CONTEXT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--format') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--format".');
      }
      options.format = readFormatValue(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith('--format=')) {
      options.format = readFormatValue(argument.slice('--format='.length));
      continue;
    }

    if (argument === '--registry') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--registry".');
      }
      options.registryPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--registry=')) {
      options.registryPath = argument.slice('--registry='.length).trim();
      continue;
    }

    if (argument === '--lifecycle') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--lifecycle".');
      }
      options.lifecycleRegistryPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--lifecycle=')) {
      options.lifecycleRegistryPath = argument.slice('--lifecycle='.length).trim();
      continue;
    }

    if (argument === '--current-context') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--current-context".');
      }
      options.currentContextPath = nextValue.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith('--current-context=')) {
      options.currentContextPath = argument.slice('--current-context='.length).trim();
      continue;
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  return options;
}

/**
 * Validates one output format value.
 * @param {string} value Raw format value.
 * @returns {"text" | "json"}
 */
function readFormatValue(value) {
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue !== 'text' && normalizedValue !== 'json') {
    throw new Error(`Unsupported format "${value}". Expected "text" or "json".`);
  }

  return normalizedValue;
}

/**
 * Builds one failure record.
 * @param {string} ruleId Rule identifier.
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Extra details.
 * @returns {{rule_id: string, message: string, details: Record<string, unknown>}}
 */
function buildFailure(ruleId, message, details) {
  return {
    rule_id: ruleId,
    message,
    details,
  };
}

/**
 * Parses CSV rows with quote support.
 * @param {string} line One CSV line.
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);
  return values;
}

/**
 * Loads one tasks.csv into row objects.
 * @param {string} taskCsvPath Repository-relative or absolute csv path.
 * @returns {Array<Record<string, string>>}
 */
function loadTaskRows(taskCsvPath) {
  const absoluteTaskCsvPath = resolve(process.cwd(), taskCsvPath);
  if (!existsSync(absoluteTaskCsvPath)) {
    return [];
  }

  const csvContent = readFileSync(absoluteTaskCsvPath, 'utf8');
  const csvLines = csvContent
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (csvLines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(csvLines[0]).map((cell) => cell.trim());
  return csvLines.slice(1).map((line) => {
    const rowValues = parseCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = String(rowValues[index] ?? '').trim();
    }
    return row;
  });
}

/**
 * Loads all project/sprint refs currently declared in current-context.
 * @param {string} currentContextPath Repository-relative current-context path.
 * @returns {Set<string>}
 */
function loadCurrentContextStreamRefs(currentContextPath) {
  const absoluteCurrentContextPath = resolve(process.cwd(), currentContextPath);
  if (!existsSync(absoluteCurrentContextPath)) {
    return new Set();
  }

  const content = readFileSync(absoluteCurrentContextPath, 'utf8');
  const refs = new Set();
  const pattern = /project=`([^`]+)`, sprint=`([^`]+)`/gmu;

  for (const match of content.matchAll(pattern)) {
    const projectRef = match[1]?.trim();
    const sprintRef = match[2]?.trim();
    if (!projectRef || !sprintRef) {
      continue;
    }
    refs.add(`${projectRef}::${sprintRef}`);
  }

  return refs;
}

/**
 * Evaluates the delivery registry payload.
 * @param {{registryPath: string, lifecycleRegistryPath: string, currentContextPath: string}} options Gate options.
 * @returns {{status: "pass" | "fail", failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>, active_solutions_scanned: number, deliveries_scanned: number, registry_path: string}}
 */
function evaluateDeliveryRegistry(options) {
  /** @type {Array<{rule_id: string, message: string, details: Record<string, unknown>}>} */
  const failures = [];
  const lifecycleRegistry = loadTechnicalSolutionLifecycleRegistry(options.lifecycleRegistryPath);

  if (!lifecycleRegistry) {
    failures.push(
      buildFailure(
        'lifecycle_registry_missing',
        'Technical solution lifecycle registry is missing.',
        {
          registry_path: options.lifecycleRegistryPath,
        },
      ),
    );
    return {
      status: 'fail',
      failures,
      active_solutions_scanned: 0,
      deliveries_scanned: 0,
      registry_path: options.registryPath,
    };
  }

  const deliveryRegistry = loadTechnicalSolutionDeliveryRegistry(options.registryPath);
  if (!deliveryRegistry) {
    failures.push(
      buildFailure(
        'delivery_registry_missing',
        'Technical solution delivery registry is missing.',
        {
          registry_path: options.registryPath,
        },
      ),
    );
    return {
      status: 'fail',
      failures,
      active_solutions_scanned: lifecycleRegistry.solutions.filter(
        (entry) => entry.status === 'active',
      ).length,
      deliveries_scanned: 0,
      registry_path: options.registryPath,
    };
  }

  const lifecycleIndex = buildTechnicalSolutionLifecycleIndex(lifecycleRegistry);
  const deliveryIndex = buildTechnicalSolutionDeliveryIndex(deliveryRegistry);
  const currentContextStreamRefs = loadCurrentContextStreamRefs(options.currentContextPath);
  const activeSolutions = lifecycleRegistry.solutions.filter((entry) => entry.status === 'active');
  const seenSolutionIds = new Set();

  for (const activeSolution of activeSolutions) {
    if (!deliveryIndex.delivery_by_solution_id.has(activeSolution.solution_id)) {
      failures.push(
        buildFailure(
          'active_solution_missing_delivery',
          'Every active technical solution must declare a delivery handoff entry.',
          {
            solution_id: activeSolution.solution_id,
          },
        ),
      );
    }
  }

  for (const deliveryEntry of deliveryRegistry.deliveries) {
    if (!deliveryEntry.solution_id) {
      failures.push(
        buildFailure('delivery_solution_id_missing', 'Delivery entry is missing solution_id.', {
          registry_path: deliveryRegistry.registry_path,
        }),
      );
      continue;
    }

    if (seenSolutionIds.has(deliveryEntry.solution_id)) {
      failures.push(
        buildFailure('duplicate_delivery_solution_id', 'solution_id must be unique.', {
          solution_id: deliveryEntry.solution_id,
        }),
      );
    }
    seenSolutionIds.add(deliveryEntry.solution_id);

    const lifecycleEntry = lifecycleIndex.solution_by_id.get(deliveryEntry.solution_id);
    if (!lifecycleEntry) {
      failures.push(
        buildFailure(
          'delivery_solution_unresolved',
          'Delivery entry must reference an existing technical solution lifecycle entry.',
          {
            solution_id: deliveryEntry.solution_id,
          },
        ),
      );
      continue;
    }

    if (lifecycleEntry.status !== 'active') {
      failures.push(
        buildFailure(
          'delivery_solution_not_active',
          'Delivery entries may only target active technical solutions.',
          {
            solution_id: deliveryEntry.solution_id,
            lifecycle_status: lifecycleEntry.status,
          },
        ),
      );
    }

    if (
      !SUPPORTED_TECHNICAL_SOLUTION_DELIVERY_MODES.includes(deliveryEntry.delivery_mode) ||
      (deliveryRegistry.allowed_delivery_modes.length > 0 &&
        !deliveryRegistry.allowed_delivery_modes.includes(deliveryEntry.delivery_mode))
    ) {
      failures.push(
        buildFailure('delivery_mode_invalid', 'Delivery mode is invalid.', {
          solution_id: deliveryEntry.solution_id,
          delivery_mode: deliveryEntry.delivery_mode,
        }),
      );
    }

    if (deliveryEntry.consumer_surfaces.length === 0) {
      failures.push(
        buildFailure(
          'consumer_surfaces_missing',
          'Delivery entries must declare at least one consumer surface.',
          {
            solution_id: deliveryEntry.solution_id,
          },
        ),
      );
    }

    for (const consumerSurface of deliveryEntry.consumer_surfaces) {
      if (
        !SUPPORTED_TECHNICAL_SOLUTION_CONSUMER_SURFACES.includes(consumerSurface) ||
        (deliveryRegistry.allowed_consumer_surfaces.length > 0 &&
          !deliveryRegistry.allowed_consumer_surfaces.includes(consumerSurface))
      ) {
        failures.push(
          buildFailure('consumer_surface_invalid', 'Consumer surface is invalid.', {
            solution_id: deliveryEntry.solution_id,
            consumer_surface: consumerSurface,
          }),
        );
      }
    }

    if (
      !SUPPORTED_TECHNICAL_SOLUTION_USER_IMPACT_LEVELS.includes(deliveryEntry.user_impact_level) ||
      (deliveryRegistry.allowed_user_impact_levels.length > 0 &&
        !deliveryRegistry.allowed_user_impact_levels.includes(deliveryEntry.user_impact_level))
    ) {
      failures.push(
        buildFailure('user_impact_level_invalid', 'user_impact_level is invalid.', {
          solution_id: deliveryEntry.solution_id,
          user_impact_level: deliveryEntry.user_impact_level,
        }),
      );
    }

    if (
      !SUPPORTED_TECHNICAL_SOLUTION_EXECUTION_STATUSES.includes(deliveryEntry.execution_status) ||
      (deliveryRegistry.allowed_execution_statuses.length > 0 &&
        !deliveryRegistry.allowed_execution_statuses.includes(deliveryEntry.execution_status))
    ) {
      failures.push(
        buildFailure('execution_status_invalid', 'Execution status is invalid.', {
          solution_id: deliveryEntry.solution_id,
          execution_status: deliveryEntry.execution_status,
        }),
      );
    }

    if (
      !SUPPORTED_TECHNICAL_SOLUTION_ROLLOUT_STATUSES.includes(deliveryEntry.rollout_status) ||
      (deliveryRegistry.allowed_rollout_statuses.length > 0 &&
        !deliveryRegistry.allowed_rollout_statuses.includes(deliveryEntry.rollout_status))
    ) {
      failures.push(
        buildFailure('rollout_status_invalid', 'rollout_status is invalid.', {
          solution_id: deliveryEntry.solution_id,
          rollout_status: deliveryEntry.rollout_status,
        }),
      );
    }

    if (!deliveryEntry.accepted_at) {
      failures.push(
        buildFailure('delivery_acceptance_missing', 'accepted_at is required.', {
          solution_id: deliveryEntry.solution_id,
        }),
      );
    }

    if (deliveryEntry.delivery_mode === 'docs_only') {
      if (deliveryEntry.execution_status !== 'not_required') {
        failures.push(
          buildFailure(
            'docs_only_status_invalid',
            '`docs_only` delivery entries must use `not_required` execution status.',
            {
              solution_id: deliveryEntry.solution_id,
              execution_status: deliveryEntry.execution_status,
            },
          ),
        );
      }
      if (deliveryEntry.rollout_status !== 'not_required') {
        failures.push(
          buildFailure(
            'docs_only_rollout_status_invalid',
            '`docs_only` delivery entries must use `rollout_status=not_required`.',
            {
              solution_id: deliveryEntry.solution_id,
              rollout_status: deliveryEntry.rollout_status,
            },
          ),
        );
      }
      continue;
    }

    const hasUserFacingSurface = deliveryEntry.consumer_surfaces.some((consumerSurface) =>
      USER_FACING_CONSUMER_SURFACES.has(consumerSurface),
    );

    if (hasUserFacingSurface && deliveryEntry.rollout_status === 'not_required') {
      failures.push(
        buildFailure(
          'user_facing_rollout_missing',
          'User-facing delivery entries must track rollout ownership.',
          {
            solution_id: deliveryEntry.solution_id,
            consumer_surfaces: deliveryEntry.consumer_surfaces,
            rollout_status: deliveryEntry.rollout_status,
          },
        ),
      );
    }

    if (
      deliveryEntry.user_impact_level === 'none' &&
      deliveryEntry.rollout_status !== 'not_required'
    ) {
      failures.push(
        buildFailure(
          'impact_rollout_mismatch',
          '`user_impact_level=none` must not declare rollout work.',
          {
            solution_id: deliveryEntry.solution_id,
            user_impact_level: deliveryEntry.user_impact_level,
            rollout_status: deliveryEntry.rollout_status,
          },
        ),
      );
    }

    if (
      deliveryEntry.rollout_status === 'not_required' &&
      deliveryEntry.rollout_artifacts.length > 0
    ) {
      failures.push(
        buildFailure(
          'rollout_artifacts_unexpected',
          '`rollout_status=not_required` must not declare rollout_artifacts.',
          {
            solution_id: deliveryEntry.solution_id,
            rollout_artifacts: deliveryEntry.rollout_artifacts,
          },
        ),
      );
    }

    if (
      deliveryEntry.rollout_status !== 'not_required' &&
      deliveryEntry.rollout_artifacts.length === 0
    ) {
      failures.push(
        buildFailure(
          'rollout_artifacts_missing',
          'Rollout-tracked delivery entries must declare rollout_artifacts.',
          {
            solution_id: deliveryEntry.solution_id,
            rollout_status: deliveryEntry.rollout_status,
          },
        ),
      );
    }

    if (
      deliveryEntry.delivery_mode === 'existing_stream' &&
      !EXISTING_STREAM_EXECUTION_STATUSES.has(deliveryEntry.execution_status)
    ) {
      failures.push(
        buildFailure(
          'existing_stream_status_invalid',
          '`existing_stream` entries must use `in_progress` or `completed`.',
          {
            solution_id: deliveryEntry.solution_id,
            execution_status: deliveryEntry.execution_status,
          },
        ),
      );
    }

    if (
      deliveryEntry.delivery_mode === 'followup_required' &&
      !FOLLOWUP_EXECUTION_STATUSES.has(deliveryEntry.execution_status)
    ) {
      failures.push(
        buildFailure(
          'followup_required_status_invalid',
          '`followup_required` entries must use `planned`, `in_progress`, or `completed`.',
          {
            solution_id: deliveryEntry.solution_id,
            execution_status: deliveryEntry.execution_status,
          },
        ),
      );
    }

    const requiredStringFields = [
      ['project_ref', deliveryEntry.project_ref],
      ['sprint_ref', deliveryEntry.sprint_ref],
      ['project_plan_path', deliveryEntry.project_plan_path],
      ['sprint_plan_path', deliveryEntry.sprint_plan_path],
      ['task_csv_path', deliveryEntry.task_csv_path],
      ['handoff_artifact_path', deliveryEntry.handoff_artifact_path],
    ];

    for (const [fieldName, fieldValue] of requiredStringFields) {
      if (!fieldValue) {
        failures.push(
          buildFailure('delivery_field_missing', 'Delivery entry is missing a required field.', {
            solution_id: deliveryEntry.solution_id,
            field: fieldName,
          }),
        );
      }
    }

    if (deliveryEntry.task_ids.length === 0) {
      failures.push(
        buildFailure(
          'delivery_task_ids_missing',
          'Delivery entries with execution ownership must declare task_ids.',
          {
            solution_id: deliveryEntry.solution_id,
          },
        ),
      );
      continue;
    }

    for (const pathValue of [
      deliveryEntry.project_plan_path,
      deliveryEntry.sprint_plan_path,
      deliveryEntry.task_csv_path,
      deliveryEntry.handoff_artifact_path,
      ...deliveryEntry.rollout_artifacts,
    ]) {
      if (!pathValue) {
        continue;
      }

      const absolutePath = resolve(process.cwd(), pathValue);
      if (!existsSync(absolutePath)) {
        failures.push(
          buildFailure('delivery_path_missing', 'Delivery path does not exist.', {
            solution_id: deliveryEntry.solution_id,
            path: pathValue,
          }),
        );
      }
    }

    const taskRows = loadTaskRows(deliveryEntry.task_csv_path);
    for (const taskId of deliveryEntry.task_ids) {
      const matchingRows = taskRows.filter((row) => row.task_id === taskId);
      if (matchingRows.length === 0) {
        failures.push(
          buildFailure(
            'delivery_task_unresolved',
            'task_ids must resolve to at least one row in the referenced tasks.csv.',
            {
              solution_id: deliveryEntry.solution_id,
              task_id: taskId,
              task_csv_path: deliveryEntry.task_csv_path,
            },
          ),
        );
        continue;
      }

      const lastRow = matchingRows[matchingRows.length - 1];
      if (lastRow.project !== deliveryEntry.project_ref) {
        failures.push(
          buildFailure(
            'delivery_task_project_mismatch',
            'tasks.csv project must match the delivery registry project_ref.',
            {
              solution_id: deliveryEntry.solution_id,
              task_id: taskId,
              expected_project: deliveryEntry.project_ref,
              actual_project: lastRow.project,
            },
          ),
        );
      }

      if (lastRow.sprint !== deliveryEntry.sprint_ref) {
        failures.push(
          buildFailure(
            'delivery_task_sprint_mismatch',
            'tasks.csv sprint must match the delivery registry sprint_ref.',
            {
              solution_id: deliveryEntry.solution_id,
              task_id: taskId,
              expected_sprint: deliveryEntry.sprint_ref,
              actual_sprint: lastRow.sprint,
            },
          ),
        );
      }
    }

    if (
      ACTIVE_STREAM_CONTEXT_STATUSES.has(deliveryEntry.execution_status) &&
      !currentContextStreamRefs.has(`${deliveryEntry.project_ref}::${deliveryEntry.sprint_ref}`)
    ) {
      failures.push(
        buildFailure(
          'followup_stream_not_registered',
          'Planned or in-progress delivery handoff must be visible from current-context active/planned streams.',
          {
            solution_id: deliveryEntry.solution_id,
            project_ref: deliveryEntry.project_ref,
            sprint_ref: deliveryEntry.sprint_ref,
            current_context_path: options.currentContextPath,
          },
        ),
      );
    }
  }

  return {
    status: failures.length > 0 ? 'fail' : 'pass',
    failures,
    active_solutions_scanned: activeSolutions.length,
    deliveries_scanned: deliveryRegistry.deliveries.length,
    registry_path: deliveryRegistry.registry_path,
  };
}

try {
  const options = resolveCliOptions(process.argv.slice(2));
  const evaluation = evaluateDeliveryRegistry(options);

  if (options.format === 'json') {
    process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
  } else if (evaluation.status === 'pass') {
    gatePass(
      GATE_NAME,
      `Validated ${evaluation.deliveries_scanned} delivery handoff entries for ${evaluation.active_solutions_scanned} active solutions.`,
    );
  } else {
    for (const failure of evaluation.failures) {
      gateInfo(GATE_NAME, `${failure.rule_id}: ${failure.message}`);
    }
    gateFail(GATE_NAME, `Detected ${evaluation.failures.length} delivery handoff issue(s).`);
  }

  if (evaluation.status !== 'pass') {
    process.exit(1);
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (process.argv.includes('--format') && process.argv.includes('json')) {
    process.stdout.write(
      `${JSON.stringify(
        {
          status: 'fail',
          failures: [
            {
              rule_id: 'runtime_error',
              message: errorMessage,
              details: {},
            },
          ],
          active_solutions_scanned: 0,
          deliveries_scanned: 0,
          registry_path: DEFAULT_TECHNICAL_SOLUTION_DELIVERY_REGISTRY_PATH,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    gateFail(GATE_NAME, errorMessage);
  }
  process.exit(1);
}
