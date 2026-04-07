import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { CliReviewLifecycleRuntime } from '../../src/runtime/review/cli-review-lifecycle-runtime.js';

describe('CliReviewLifecycleRuntime', () => {
  it('prefers Worktree Review Target review records over the active primary stream review path', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'cli-review-lifecycle-runtime-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const currentContextPath = resolve(workspaceRoot, 'context', 'current-context.md');

    try {
      await mkdir(dirname(currentContextPath), { recursive: true });
      await writeFile(
        currentContextPath,
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-042-review-command-fixture\`
- Sprint: \`sprint-003-review-lifecycle\`
- Docs root: \`.repo-ai-governor/context/dev/project-042-review-command-fixture\`
- Task records: \`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/\`

## Active Streams

- \`active-1\`: role=\`primary\`, project=\`project-042-review-command-fixture\`, sprint=\`sprint-003-review-lifecycle\`, docs=\`.repo-ai-governor/context/dev/project-042-review-command-fixture\`, plan=\`.repo-ai-governor/context/dev/project-042-review-command-fixture/plan.md\`, tasks=\`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/\`, checklist=\`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/checklist.md\`, csv=\`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks/tasks.csv\`, review=\`.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/review/\`, status=\`active\`, note=\`fixture\`

## Worktree Review Target

- Project: \`project-999-review\`
- Sprint: \`sprint-001-closeout\`
- Review records: \`.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review\`
- Stream State: \`completed\`
- Reason: \`close pending review lifecycle in completed stream\`
- Clear when: \`no code_review_* or verified_code_review_* files remain\`
`,
        'utf8',
      );

      const runtime = new CliReviewLifecycleRuntime(temporaryRoot, workspaceRoot);
      const streamContext = await runtime.resolveStreamContext();

      expect(streamContext.projectId).toBe('project-042-review-command-fixture');
      expect(streamContext.sprintId).toBe('sprint-003-review-lifecycle');
      expect(streamContext.reviewDirPath).toBe(
        resolve(
          temporaryRoot,
          '.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review',
        ),
      );
      expect(streamContext.tasksDirPath).toBe(
        resolve(
          temporaryRoot,
          '.repo-ai-governor/context/dev/project-042-review-command-fixture/sprint-003-review-lifecycle/tasks',
        ),
      );
      expect(streamContext.usesFallbackReviewDir).toBe(false);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('extracts review slugs from both canonical and legacy verified artifact prefixes', () => {
    const runtime = new CliReviewLifecycleRuntime('/tmp/repository-root', '/tmp/workspace-root');

    expect(
      runtime.extractReviewSlugFromArtifactPath(
        '/tmp/repository-root/.repo-ai-governor/context/review/verified_code_review_demo.md',
      ),
    ).toBe('demo');
    expect(
      runtime.extractReviewSlugFromArtifactPath(
        '/tmp/repository-root/.repo-ai-governor/context/review/verified_review_demo.md',
      ),
    ).toBe('demo');
  });
});
