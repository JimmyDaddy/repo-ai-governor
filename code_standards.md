# Code Standards

This file defines repository-level coding standards and the executable gate commands that enforce them.

## Non-negotiable Rules

- [CS-001] All code changes must pass automated tests before delivery.
- [CS-002] Commit messages for delivered changes must follow Conventional Commits.
- [CS-003] Any TODO/FIXME/HACK marker must be resolved or explicitly recorded as known risk.
- [CS-004] Delivery records must include verification evidence for implemented tasks.
- [CS-005] In this native Node.js ESM repository, all relative import/export specifiers must use explicit file extensions (for example `./foo.js`).

## Verification Commands

```bash
node ./scripts/governance/check-esm-import-specifiers.js
npm run test -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## Notes

1. Do not use `npm run check` in verification commands to avoid recursive gate execution.
2. Prefer deterministic commands that can run in CI.
