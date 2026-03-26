# DA-223 packaging install matrix and failure taxonomy baseline

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-223`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. Summary

1. 已使用现有 `release:verify-cleanroom-local-install` 工具链对 `path`、`link`、`tgz` 三种安装模式执行一轮 clean-room baseline。
2. `path` 与 `link` 在当前默认沙箱环境下均通过完整 `--help -> init -> doctor -> check` 链路，同时通过 workspace switch rollback、read-only attach precheck 与 service-host memory-provider scenario。
3. `tgz` 在默认沙箱环境失败，但失败点已经更新：不是旧 README 声明的 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`，而是 install-time registry dependency resolution failure。
4. 在放开网络后复跑同一 `tgz` 验证，完整链路与 service-host memory-provider scenario 均通过，说明当前 packaged runtime resolvability baseline 已经好于旧文档描述。
5. 额外执行 `release:verify-local` 后，packed distribution 本地验证通过，证明 tarball manifest 与 examples/runtime smoke 当前可以通过。

## 2. Install Matrix Baseline

| mode | environment | result | current interpretation |
|---|---|---|---|
| `path` | default sandbox | passed | baseline local onboarding path works |
| `link` | default sandbox | passed | baseline local onboarding path works |
| `tgz` | default sandbox | failed | fails at install-time external dependency fetch under restricted network |
| `tgz` | escalated network-enabled run | passed | packaged tarball installs and completes command chain when registry access exists |

## 3. Failure Classes

1. `install_time_registry_dependency_resolution_failure`
   - Trigger: `pnpm add --save-exact <tarball>` under restricted network.
   - Current signal:
     - `commander`
     - `i18next`
     - `yaml`
     - registry `ENOTFOUND`
   - Meaning: tarball install is not offline/self-contained; installation still depends on registry access for external dependencies.
2. `stage9a_hard_exit_not_met`
   - Trigger: this baseline only ran `1` iteration per mode, and each report selected only one mode.
   - Meaning: current evidence is sufficient for taxonomy baseline, but not for Stage 9A/GA hard-exit criteria.
3. `legacy_runtime_module_missing_claim_is_stale`
   - Trigger: old README still says `tgz` fails with `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`.
   - Current signal: network-enabled `tgz` run passed the full command chain, so that statement is no longer the dominant failure class.

## 4. Evidence Paths

1. `path` clean-room report: `.tmp/project-020-tk-223/path-report.json`
2. `link` clean-room report: `.tmp/project-020-tk-223/link-report.json`
3. `tgz` restricted-network report: `.tmp/project-020-tk-223/tgz-report.json`
4. `tgz` network-enabled report: `.tmp/project-020-tk-223/tgz-report-network.json`
5. Local distribution verification: `node ./scripts/release/verify-local-distribution.js`

## 5. Downstream Input Constraints

1. `TK-224` 不应再默认沿用 README 中“`tgz` = runtime `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`”的旧判断，而应重新盘点当前 tarball manifest、external dependencies 与 packed surface truthfulness。
2. `TK-224` 需要明确区分两类问题：
   - packed runtime resolvability
   - install-time registry dependency requirements
3. `TK-225` 需要把 `tgz` 的 truthfulness 口径更新为：
   - online/registry-enabled clean-room currently passes
   - restricted-network or offline clean-room currently not supported as tarball self-contained install
4. 若后续目标是“`tgz` 在受限网络下也可安装”，那属于新的 packaged distribution closure 目标，不能继续混淆为 `@repo-ai-governor/cli` 丢失问题。
