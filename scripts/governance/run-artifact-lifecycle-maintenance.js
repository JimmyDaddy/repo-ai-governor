#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
const reconcileScriptPath = resolve(
  process.cwd(),
  'scripts/governance/reconcile-artifact-dependencies.js',
);
const compactScriptPath = resolve(process.cwd(), 'scripts/governance/compact-artifact-registry.js');

/**
 * Runs one node governance script and exits on failure.
 * @param {string} scriptPath Absolute script path.
 * @param {string[]} args Forwarded CLI args.
 */
function runScriptOrExit(scriptPath, args) {
  const result = spawnSync('node', [scriptPath, ...args], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

runScriptOrExit(reconcileScriptPath, argv);
runScriptOrExit(compactScriptPath, argv);
