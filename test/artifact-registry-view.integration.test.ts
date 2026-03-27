import { execFileSync } from 'node:child_process';

describe('artifact registry view renderer', () => {
  it('renders canonical registry data as a human-readable view', () => {
    const output = execFileSync('node', ['./scripts/governance/render-artifact-registry-view.js'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    expect(output).toContain('# Artifact Registry View');
    expect(output).toContain('.repo-ai-governor/context/artifact-registry/artifacts.csv');
    expect(output).toContain('## Main Registry');
    expect(output).toContain('## Archive Registry');
    expect(output).toContain('DA-057');
    expect(output).toContain('DA-002');
  });
});
