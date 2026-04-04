import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { LocalOrchestrationServiceShell } from '../src/index.js';

describe('core-orchestration-service artifact-pane review routing', () => {
  it('prefers Worktree Review Target review records over a primary `Review records: none` marker', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-review-route-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review',
    );
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`
- Docs root: \`none\`
- Task records: \`none\`
- Review records: \`none\`

## Worktree Review Target

- Project: \`project-999-review\`
- Sprint: \`sprint-001-closeout\`
- Review records: \`.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review\`
- Stream State: \`completed\`
- Reason: \`close pending review lifecycle in completed stream\`
- Clear when: \`no code_review_* or verified_code_review_* files remain\`
`,
      );
      await writeFile(
        resolve(reviewDirectoryPath, 'code_review_demo.md'),
        `# Code Review: demo

- Status: review_pending
- Date: 2026-04-05
`,
      );

      const artifactPane = await orchestrationService.queryArtifactPane();

      expect(artifactPane.reviewSourcePath).toBe(reviewDirectoryPath);
      expect(artifactPane.reviews).toHaveLength(1);
      expect(artifactPane.reviews[0]?.reviewId).toBe('code_review_demo.md');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('does not publish a fake review source when current-context review records are set to `none`', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-review-none-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`
- Docs root: \`none\`
- Task records: \`none\`
- Review records: \`none\`
`,
      );

      const artifactPane = await orchestrationService.queryArtifactPane();

      expect(artifactPane.reviewSourcePath).toBeUndefined();
      expect(artifactPane.reviews).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
