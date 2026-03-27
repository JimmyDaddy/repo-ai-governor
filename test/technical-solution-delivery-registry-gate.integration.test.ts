import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface DeliveryFailure {
  rule_id: string;
  message: string;
  details: Record<string, unknown>;
}

interface DeliveryResult {
  status: 'pass' | 'fail';
  failures: DeliveryFailure[];
  active_solutions_scanned: number;
  deliveries_scanned: number;
  registry_path: string;
}

interface DeliveryOutcome {
  exitCode: number;
  result: DeliveryResult;
}

const SCRIPT_PATH = resolve(
  process.cwd(),
  'scripts/governance/check-technical-solution-delivery-registry.js',
);
const DEFAULT_REGISTRY_PATH = '.repo-ai-governor/context/technical-solution-delivery-registry.yaml';
const DEFAULT_LIFECYCLE_REGISTRY_PATH =
  '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml';
const DEFAULT_CURRENT_CONTEXT_PATH = '.repo-ai-governor/context/current-context.md';

/**
 * Executes the delivery registry checker and always returns machine output.
 * @param {{registryPath?: string, lifecycleRegistryPath?: string, currentContextPath?: string}} [options] Runtime options.
 * @returns {DeliveryOutcome}
 */
function runDeliveryGate(
  options: {
    registryPath?: string;
    lifecycleRegistryPath?: string;
    currentContextPath?: string;
  } = {},
): DeliveryOutcome {
  const commandArgs = [
    SCRIPT_PATH,
    '--format',
    'json',
    '--registry',
    options.registryPath ?? DEFAULT_REGISTRY_PATH,
    '--lifecycle',
    options.lifecycleRegistryPath ?? DEFAULT_LIFECYCLE_REGISTRY_PATH,
    '--current-context',
    options.currentContextPath ?? DEFAULT_CURRENT_CONTEXT_PATH,
  ];

  try {
    const stdout = execFileSync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      exitCode: 0,
      result: JSON.parse(stdout) as DeliveryResult,
    };
  } catch (error) {
    const commandError = error as {
      status?: number;
      stdout?: string | Buffer;
    };
    const rawStdout =
      typeof commandError.stdout === 'string'
        ? commandError.stdout
        : (commandError.stdout?.toString('utf8') ?? '');

    return {
      exitCode: commandError.status ?? 1,
      result: JSON.parse(rawStdout) as DeliveryResult,
    };
  }
}

describe('technical-solution-delivery-registry gate', () => {
  it('passes for the repository delivery registry', () => {
    const outcome = runDeliveryGate();

    expect(outcome.exitCode).toBe(0);
    expect(outcome.result.status).toBe('pass');
    expect(outcome.result.failures).toHaveLength(0);
    expect(outcome.result.deliveries_scanned).toBeGreaterThan(0);
  });

  it('fails when active solutions are missing handoff and follow-up stream refs are unresolved', () => {
    const tempRoot = resolve(process.cwd(), '.tmp/delivery-registry-gate-test');
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(join(tempRoot, 'project-021', 'sprint-001', 'tasks'), { recursive: true });

    const lifecycleRegistryPath = join(tempRoot, 'lifecycle.yaml');
    writeFileSync(
      lifecycleRegistryPath,
      [
        'schema_version: 1',
        'allowed_statuses:',
        '  - draft',
        '  - active',
        'solutions:',
        '  - solution_id: solution-a',
        '    title: Solution A',
        '    status: active',
        '    owner: runtime',
        '    version: v1',
        '    scope: runtime',
        '    draft_paths: []',
        '    review_paths:',
        '      - .repo-ai-governor/context/dev/project-000/review/resolved.md',
        '    final_paths:',
        '      - .repo-ai-governor/normative_knowledge_sources/technical-solutions/module-a.md',
        '    target_module_ids:',
        '      - module-a',
        '    north_star_refs:',
        '      - overall.runtime',
        '    approved_at: 2026-03-27',
        '    approved_by: AI-Agent',
        '    activated_at: 2026-03-27',
        '    supersedes: []',
        '  - solution_id: solution-b',
        '    title: Solution B',
        '    status: active',
        '    owner: runtime',
        '    version: v1',
        '    scope: runtime',
        '    draft_paths: []',
        '    review_paths:',
        '      - .repo-ai-governor/context/dev/project-000/review/resolved.md',
        '    final_paths:',
        '      - .repo-ai-governor/normative_knowledge_sources/technical-solutions/module-b.md',
        '    target_module_ids:',
        '      - module-b',
        '    north_star_refs:',
        '      - overall.runtime',
        '    approved_at: 2026-03-27',
        '    approved_by: AI-Agent',
        '    activated_at: 2026-03-27',
        '    supersedes: []',
      ].join('\n'),
      'utf8',
    );

    const tasksCsvPath = join(tempRoot, 'project-021', 'sprint-001', 'tasks', 'tasks.csv');
    writeFileSync(
      tasksCsvPath,
      [
        'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at',
        'exec-1,TK-901,test handoff,AI-Agent,P0,2026-03-27,planned,project-021-test,sprint-001-test,plan,result,verify,review,2026-03-27',
      ].join('\n'),
      'utf8',
    );

    const projectPlanPath = join(tempRoot, 'project-021', 'plan.md');
    const sprintPlanPath = join(tempRoot, 'project-021', 'sprint-001', 'plan.md');
    const handoffArtifactPath = join(tempRoot, 'project-021', 'sprint-001', 'tasks', 'DA-901.md');
    writeFileSync(projectPlanPath, '# project\n', 'utf8');
    writeFileSync(sprintPlanPath, '# sprint\n', 'utf8');
    writeFileSync(handoffArtifactPath, '# artifact\n', 'utf8');

    const deliveryRegistryPath = join(tempRoot, 'delivery.yaml');
    writeFileSync(
      deliveryRegistryPath,
      [
        'schema_version: 1',
        'allowed_delivery_modes:',
        '  - docs_only',
        '  - followup_required',
        'allowed_consumer_surfaces:',
        '  - internal_governance',
        '  - runtime_service',
        'allowed_user_impact_levels:',
        '  - none',
        '  - medium',
        'allowed_execution_statuses:',
        '  - not_required',
        '  - planned',
        'allowed_rollout_statuses:',
        '  - not_required',
        '  - planned',
        'deliveries:',
        '  - solution_id: solution-a',
        '    delivery_mode: followup_required',
        '    consumer_surfaces:',
        '      - runtime_service',
        '    user_impact_level: medium',
        '    execution_status: planned',
        '    rollout_status: not_required',
        '    owner: runtime',
        '    project_ref: project-021-test',
        '    sprint_ref: sprint-001-test',
        '    task_ids:',
        '      - TK-999',
        `    project_plan_path: ${projectPlanPath.replace(/\\/g, '/')}`,
        `    sprint_plan_path: ${sprintPlanPath.replace(/\\/g, '/')}`,
        `    task_csv_path: ${tasksCsvPath.replace(/\\/g, '/')}`,
        `    handoff_artifact_path: ${handoffArtifactPath.replace(/\\/g, '/')}`,
        '    rollout_artifacts: []',
        '    accepted_at: 2026-03-27',
      ].join('\n'),
      'utf8',
    );

    const currentContextPath = join(tempRoot, 'current-context.md');
    writeFileSync(
      currentContextPath,
      [
        '# Current Context',
        '',
        '## Active Streams',
        '',
        '- `primary`: project=`project-000`, sprint=`sprint-000`, tasks=`tasks/`, checklist=`checklist.md`, csv=`tasks.csv`, review=`review/`, status=`active`',
      ].join('\n'),
      'utf8',
    );

    const outcome = runDeliveryGate({
      registryPath: deliveryRegistryPath,
      lifecycleRegistryPath,
      currentContextPath,
    });
    rmSync(tempRoot, { recursive: true, force: true });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe('fail');
    expect(
      outcome.result.failures.some(
        (failure) => failure.rule_id === 'active_solution_missing_delivery',
      ),
    ).toBe(true);
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === 'delivery_task_unresolved'),
    ).toBe(true);
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === 'user_facing_rollout_missing'),
    ).toBe(true);
    expect(
      outcome.result.failures.some(
        (failure) => failure.rule_id === 'followup_stream_not_registered',
      ),
    ).toBe(true);
  });
});
