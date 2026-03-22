# Repo AI Governor Examples

## 1. Scope

This directory is the Stage 9A canonical `examples/` baseline for external repository adoption.

Included executable scenario docs:

1. `examples/single-role-minimal-flow/README.md`
2. `examples/multi-role-collaboration-flow/README.md`
3. `examples/hitl-escalation-flow/README.md`
4. `examples/restricted-network-degrade-flow/README.md`

Each scenario now includes runtime assets:

1. `scenario.json`: machine-readable command chain and assertions.
2. `fixtures/`: stable input assumptions for reproducible execution.
3. `expected/`: baseline operation mapping consumed by gates.

## 2. Example Smoke

Run the blocking smoke gates before delivery:

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
```

The doc smoke gate blocks when:

1. `examples/` or required scenario docs are missing.
2. Scenario docs drift from current CLI command contract.
3. Scenario docs drift from required governance gate baseline.
4. Scenario docs drift from external consumption contract/support matrix refs.

The runtime smoke gate blocks when:

1. Any scenario command cannot execute end-to-end in an isolated temp workspace.
2. Output payload is not valid JSON contract (`status/command/command_result.operation`).
3. Required artifact IDs declared by scenario assertions are missing.

## 3. Doc Backlinks

1. Tool user guide entry: `README.md`
2. Local adoption playbook task card: `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-079-user-docs-and-local-adoption-playbook.md`

## 4. Contract And Matrix Refs

1. External consumption contract matrix ref:
   `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. Minimum support matrix ref:
   `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
