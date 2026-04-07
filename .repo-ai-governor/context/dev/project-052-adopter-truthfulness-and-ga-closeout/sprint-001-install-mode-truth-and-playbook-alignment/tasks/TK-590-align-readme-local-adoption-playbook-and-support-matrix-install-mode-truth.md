# TK-590 align README local adoption playbook and support matrix install-mode truth

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-590`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. 任务目标

对齐 README、local adoption playbook 与 support matrix 的 install-mode 叙事。

## 2. Depends On

1. `TK-589`

## 3. 预期产物

1. 更新后的 `README.*`
2. 更新后的 `docs/local-adoption-playbook.*`
3. install-mode truth sync 记录

## 4. Required Inputs

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-002-packaged-runtime-cutover-and-release-gate-block/tasks/DA-227-packaged-docs-truthfulness-and-root-readme-playbook-cutover.md`
2. `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`

## 6. 实施计划

1. 统一 README、双语 playbook 与 support matrix 对 install modes 的推荐顺序和边界表述。
2. 去掉会让 adopter 误解为“所有路径同等级支持”或“tgz 离线可用” 的模糊叙事。
3. 为 `TK-591` 的证据写回准备可直接引用的 truth surface。

## 7. Development Verification

1. `rg -n "dist|tgz|path|link|dirty|Yarn|npm" README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md docs/support-matrix.md docs/support-matrix.zh-CN.md`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-590`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-589` 完成。
2. 2026-04-06：开始对齐 README、README.zh-CN、双语 local adoption playbook 与双语 support matrix 的 install-mode 叙事。
3. 2026-04-06：已完成双语 README / playbook / support matrix 对齐，统一 `dist-binary` 命名、install-mode 推荐顺序与 support boundary 回链，并产出 `DA-590`。

## 10. 产出

1. `DA-590-readme-playbook-and-support-matrix-install-mode-truth-sync.md`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
