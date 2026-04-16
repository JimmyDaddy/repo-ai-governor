# Adopter Quickstart Bootstrap Command Technical Solution (Draft)

- Status: draft
- Date: 2026-04-15
- Owner: AI-Agent
- Scope: `runtime.governance-clients installer follow-up UX for one-command target-repo install quickstart over init + doctor + adopt apply + adopt verify, while keeping broader check audit explicit`
- Target Modules:
  - `runtime.governance-clients`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`
  - `README.md`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`
  - `apps/cli/src/constants/cli-command.constant.ts`
  - `apps/cli/src/commands/init-command.ts`
  - `apps/cli/src/commands/doctor-command.ts`
  - `apps/cli/src/commands/adopt-command.ts`

## 1. 背景与问题

当前仓库已经具备“把治理能力安装到其他仓库”的正式能力，但 adopter 当前仍需要先理解并串联两层公开支持 surface：

1. baseline bootstrap / audit：
   - `init`
   - `doctor`
   - `check`
2. managed install lifecycle：
   - `adopt apply`
   - `adopt verify`

这条链路已经在 `README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 中被定义为受支持路径，但它仍有三个真实摩擦点：

1. 新 adopter 需要先理解“workspace bootstrap”和“managed adoption lifecycle”是两层 surface，才知道该先跑什么。
2. 公开推荐路径虽然稳定，却还不是“一条命令完成受支持安装”的体验。
3. 现有 installer contract formalize 了 `adopt apply/diff/upgrade/remove`、receipt、managed ownership 与 `self-host-complete` template bootstrap boundary，但没有专门收口“installer convenience orchestration”这一层 UX。

换句话说，当前缺的不是 installer truth，而是 installer truth 上方的一层 adopter-friendly convenience entry。

## 2. 目标

1. 为目标仓库提供一条更短、更容易记忆的受支持安装入口。
2. 复用现有 `init`、`doctor`、`check`、`adopt apply`、`adopt verify` 的公开事实面与 artifact；其中 quickstart 只内联 install-affecting stages，而不是创造平行 installer truth。
3. 让 CLI help、README 与 adopter playbook 能围绕同一条“快速安装链”对外表达。
4. 保持 fail-closed 边界：默认 `tool_managed`、显式 `repo_local`、显式 `self-host-complete`、不隐式扩张为 `connect` 或 runtime execution onboarding。

## 3. 非目标

1. 不替代 `adopt apply` / `adopt verify` 作为 canonical 安装生命周期命令。
2. 不把 `connect`、adapter readiness、first dry-run execution 收进本轮快捷安装入口。
3. 不新增新的安装模式；`path` / `link` / `dist-binary` / `tgz` 的支持边界保持不变。
4. 不把 bootstrap summary artifact 升格为 install receipt 或新的 canonical install truth。
5. 不隐式切换 `workspace.mode`，也不隐式启用 `self-host-complete`。
6. 不把更广义的 `check` audit 吞进 install success gate；`check` 仍是显式 governance audit surface。

## 4. 现状与约束

1. `runtime.governance-clients` 已 formalize installer-layer `adoption pack` boundary；当前正式 installer story 是 `adopt list/apply/diff/verify/upgrade/remove`，而不是 `host export`。
2. `init` 已负责 workspace 目录、config 文件与 init manifest 的 baseline bootstrap。
3. `doctor` 已负责 workspace baseline、safe-local fix、adapter verification 与 diagnostics artifact，但 external adopter 场景下部分 warning 是允许存在的。
4. `check` 已负责更广义的治理审计与 machine-readable facts；它不是 installer receipt/verify 的别名。
5. `adopt apply` / `adopt verify` 已负责 managed ownership、receipt、verification summary 与 fail/warn/pass 结果。
6. 当前 CLI 顶层命令集已经较多；新增一个顶层安装命令会扩大 `CliCommandName`、帮助文案、IDE wrapper、示例与 help smoke 的影响面。
7. adoption contract 已明确：
   - 默认 `workspace_mode=tool_managed`
   - `repo_local` 只能显式选择
   - `self-host-complete` 只允许显式 opt-in 且只 seed template-backed canonical surface
8. `README.md` 与 `docs/local-adoption-playbook.md` 当前把“bootstrap”公开解释为 `init -> doctor -> check` baseline，之后才进入 `adopt apply -> adopt verify` 的 managed install lifecycle；新的 convenience command 必须把这两个层次说清楚，不能让 `check` 像是消失了。
9. 当前 `adopt apply` 已接受 `pack-id` 或 `profile-id` 作为 selector，而 `adopt upgrade/remove` 继续拥有 post-install lifecycle；新的 convenience surface 不能再发明一套 selector 或 upgrade 语义。

## 5. 方案选项与对比

### 5.1 方案 A：只继续补 README / playbook，不新增命令面

1. 方案描述：
   - 保持现有 `init -> doctor -> check` baseline 与 `adopt apply -> adopt verify` managed install lifecycle
   - 只在文档中继续强调“推荐顺序”
2. 优点：
   - 实现成本最低
   - 不引入新的 CLI 语义
3. 缺点：
   - 用户仍要自己拼接多条命令
   - 不满足“快捷方便安装到其他仓库”的直接目标
   - 文档能解释路径，但不能减少命令面摩擦

### 5.2 方案 B：新增顶层 `bootstrap` 或 `quickstart` 命令

1. 方案描述：
   - 在顶层命令集中新增一个 adopter-facing 入口
   - 内部编排 `init -> doctor -> adopt apply -> adopt verify`
2. 优点：
   - 对新用户最直观
   - marketing / README wording 最容易理解
3. 缺点：
   - 需要扩张 `CliCommandName` 与顶层 help catalog
   - 容易与现有 `init`、`adopt` 家族形成“两个 installer family”的心智重叠
   - 需要更大范围更新 CLI help、IDE wrapper、examples 与 discoverability 文案

### 5.3 方案 C：在 `adopt` 家族下新增 `adopt bootstrap`

1. 方案描述：
   - 保持顶层命令集不变
   - 在现有 installer family 下新增 convenience subcommand
   - 由 `adopt bootstrap` 内部编排 `init -> doctor --fix -> adopt apply -> adopt verify`
   - broader `check` 继续保留为显式 follow-up audit，而不是被静默吞并到 install result 里
2. 优点：
   - 与现有 installer contract、receipt、managed ownership 语义天然一致
   - 顶层命令 catalog 不需要新增 family，改动面更小
   - 更容易复用 `CliAdoptCommand` 与 adoption runtime 现有实现
   - 帮助文案上仍能明确“这是 installer convenience surface，不是第二套 truth”
3. 缺点：
   - 命令长度不如顶层 `bootstrap` 短
   - 仍需设计 bootstrap summary artifact、blocking matrix 与参数归并规则

### 5.4 对比结论

推荐方案 C。

原因：

1. 这次缺口本质上是 installer convenience UX，而不是新的顶层治理能力。
2. 现有 adopter story 已明确由 `adopt` family 承担；继续把 convenience 入口放在 `adopt` 下，更符合现有 contract 和 public support truth。
3. 方案 C 能更好地控制 blast radius，同时避免把“快捷入口”误读成“新安装模式”或“替代 `adopt apply/verify` 的第二套 lifecycle”。

## 6. 推荐方案

### 6.1 命令面建议

引入新的 public convenience surface：

```bash
repo-ai-governor adopt bootstrap [pack-selector] --repo <path> --hosts <list> [options]
```

先说人话，可以把这几个词理解成：

1. `pack` = “安装包”，表示这次要用哪一个治理能力发行包
2. `profile` = “安装套餐”，表示这个安装包里具体要落哪一套内容
3. `pack-selector` = “命令行偷懒入口”，为了让用户少记参数，位置参数既能填安装包名，也能直接填套餐名

如果类比成软件安装：

1. `pack-id` 更像“安装包名”
2. `profile-id` 更像“标准安装 / 完整安装 / 自托管安装”这种套餐名
3. `pack-selector` 更像“命令行首页快捷输入框”，允许你直接输上面任意一个常用标识

建议在 draft 中直接用下面这张表表达，而不是只写术语：

| 名称 | 说人话 | 作用 | 例子 | 普通使用者要不要关心 |
| --- | --- | --- | --- | --- |
| `pack-id` | 安装包名 | 标识到底是哪个 adoption pack 被安装 | `repo-ai-governor-adoption-pack` | 一般不用专门记 |
| `profile-id` | 安装套餐名 | 决定安装包里具体落哪套内容 | `adopter-complete`、`self-host-complete` | 需要，大多数人主要关心这个 |
| `pack-selector` | 命令行简写入口 | 位置参数；既可以填 `pack-id`，也可以直接填 `profile-id` | `repo-ai-governor-adoption-pack` 或 `adopter-complete` | 需要，但把它当“可偷懒的输入位”就够了 |
| `--adoption-profile` | 显式指定套餐 | 当你传的是 `pack-id`，或想明确覆盖默认套餐时使用 | `--adoption-profile self-host-complete` | 进阶场景才需要 |

如果 reviewer 继续追问“那 `repo-ai-governor-adoption-pack` 现在在仓库哪里”，建议直接用下面这段人话解释：

1. 它当前不是仓库根目录下一个单独的文件夹，也不是一个现成的 tgz 文件
2. 现在这份 built-in pack 是“内建在源码里”的
3. `pack-id` 常量定义在 `packages/standards/src/constants/adoption-pack.constant.ts`
4. pack 的 manifest、workflow records、template records 主要定义在 `packages/standards/src/built-in-adoption-pack-catalog.ts`
5. runtime 通过 `packages/standards/src/adoption-pack-registry.ts` 把这份 built-in pack 暴露给 `adopt list/apply/verify/upgrade/remove`
6. 安装完成后，目标仓库里出现的 `.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/` 是“安装结果/receipt/summary 存放处”，不是这份 built-in pack 在源码仓库里的定义目录

可以再用一个对比表把“源码定义位置”和“安装结果位置”分开：

| 你要找的是什么 | 现在在哪 | 说人话 |
| --- | --- | --- |
| built-in pack 的名字常量 | `packages/standards/src/constants/adoption-pack.constant.ts` | 这里只定义“这包叫什么” |
| built-in pack 的真实内容 | `packages/standards/src/built-in-adoption-pack-catalog.ts` | 这里定义“这包里有什么模板、技能、投影内容” |
| built-in pack 的运行时装载入口 | `packages/standards/src/adoption-pack-registry.ts` | 这里负责把内建 pack 注册出来给 CLI 用 |
| 某个目标仓库安装后的记录 | `<target-repo>/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/` | 这里是“安装结果”，不是源码定义本体 |

为避免概念继续打架，本方案建议保持下面这条解释口径：

1. built-in pack 的 canonical `pack-id` 是 `repo-ai-governor-adoption-pack`
2. built-in `profile-id` 主要是 `adopter-complete` 与 `self-host-complete`
3. receipt、verification summary 与 managed ownership 里记录 canonical 安装真值时，仍应写真实 `packId`
4. 面向用户的快捷命令可以继续接受 `pack-selector`，但文档要优先解释“它只是一个方便输入位”

最常见的几种写法可以直接这样理解：

| 你想干什么 | 推荐写法 | 怎么理解 |
| --- | --- | --- |
| 最省心，按默认推荐安装 | `repo-ai-governor adopt bootstrap --repo .` | 不写 selector，不写 profile，走 built-in pack + 默认 `adopter-complete` |
| 明确说“我要装 adopter 套餐” | `repo-ai-governor adopt bootstrap adopter-complete --repo .` | 直接把 `profile-id` 填进 `pack-selector` |
| 明确写“用这个 pack + 这个 profile” | `repo-ai-governor adopt bootstrap repo-ai-governor-adoption-pack --adoption-profile adopter-complete --repo .` | 写全量显式参数，最不歧义 |
| 我要自托管模板面 | `repo-ai-governor adopt bootstrap repo-ai-governor-adoption-pack --adoption-profile self-host-complete --workspace-mode repo_local --repo .` | 显式切到 repo-local，并明确要 self-host 套餐 |

建议默认行为：

1. `pack-selector` 缺省时解析到 built-in pack `repo-ai-governor-adoption-pack`
2. `--adoption-profile` 缺省时默认取 `adopter-complete`
3. `--workspace-mode` 缺省时沿用当前默认 `tool_managed`
4. `--doctor-fix` 默认开启 safe-local 修复
5. `--adoption-profile self-host-complete` 只有在显式 `--workspace-mode repo_local` 时才允许

### 6.1.1 命名与 selector 边界

1. 文案上必须显式区分：
   - `baseline bootstrap` = `init + doctor + check`
   - `adopt bootstrap` = installer quickstart convenience surface
2. 当 `pack-selector` 缺省时，`adopt bootstrap` 只允许落到官方 built-in pack `repo-ai-governor-adoption-pack`；它不应因为 convenience shortcut 而静默切换到 `global` 或 `repo_local` override。
3. 当显式传入 `pack-selector` 时，`adopt bootstrap` 应直接复用当前 `adopt apply` 的解析语义：
   - 先按 `pack-id` 解析
   - 失败后才按 `profile-id` 回退
4. 若未来出现多个 pack 共享同一 `profile-id`，或 selector 目标在当前 catalog 中不再唯一，`adopt bootstrap` 必须 fail-closed 并要求用户显式传入 `pack-id`（必要时再配合 `--adoption-profile`），不能猜测解析结果。

### 6.2 编排链路建议

`adopt bootstrap` 内部按固定顺序编排：

1. `init`
   - 负责 workspace baseline bootstrap
   - 若 workspace/config 已存在，则允许复用而不是强制重置
2. `doctor --fix`
   - 负责 safe-local baseline preflight
   - 只做当前 contract 已允许的本地安全修复
3. `adopt apply`
   - 负责真正 materialize managed adoption baseline
   - 继续产出 canonical install receipt
4. `adopt verify`
   - 负责安装后验证
   - 继续产出 canonical verification summary

`check` 不进入 Phase A orchestration mainline：

1. 它继续保留为 broader governance audit follow-up，用于输出超出 installer safety 之外的 machine-readable facts。
2. `adopt bootstrap` 的帮助文案、README 与 adopter playbook 必须显式说明：
   - install quickstart 成功不等于 broader governance audit 已完成
   - 需要更广义治理事实时，仍应显式执行 `check`

### 6.3 阶段状态、阻断规则与重入边界

建议把 bootstrap orchestration 的状态规则显式化：

1. 以下情况必须在 `adopt apply` 之前阻断：
   - `init` 失败
   - workspace 在 safe-local 修复后仍不可写
   - config baseline 无法建立
2. 以下情况不应把 bootstrap 直接判成失败，但应保留 `warn`：
   - external adopter 仓库缺少 self-host baseline docs
   - 非关键的 informational diagnostics
   - `adopt verify` 返回 `warn` 而不是 `fail`
3. `adopt apply` 或 `adopt verify` 返回 `fail` 时，bootstrap 总结果必须为 `fail`
4. `check` 不参与 `adopt bootstrap` 的 `pass / warn / fail` 总结果聚合；若用户需要 broader governance audit，command result 与 docs 必须回链显式 `check`。
5. 若目标仓库已存在匹配当前 `pack-id/profile-id` 的 install receipt，且 managed files 没有 drift，`adopt bootstrap` 可以作为 convenience rerun 继续执行，但 bootstrap summary 必须显式记录 `reentry_mode=reuse_existing_installation`。
6. 若已存在 receipt 但 pack/profile 不匹配，或 managed files 已 drift，`adopt bootstrap` 必须在 `adopt apply` 之前 fail-closed，并把用户重定向到 `adopt diff` / `adopt upgrade` / `adopt remove`；它不能静默把自己升级成 cross-pack migration 或 `upgrade --force` 代理。

### 6.4 Artifact 与 canonical truth 关系

本方案建议新增一个 additive bootstrap summary artifact，但必须保持边界清晰：

1. 建议路径：
   - `<workspaceRoot>/context/diagnostics/adoption-bootstrap/<bootstrap-id>.json`
2. 建议内容：
   - stage order
   - selector_resolution（例如 `default_built_in`、`explicit_pack`、`explicit_profile_alias`）
   - reentry_mode（例如 `fresh_install`、`reuse_existing_installation`）
   - per-stage status
   - init manifest path
   - doctor diagnostics path
   - adopt apply receipt path
   - adopt verify summary path
   - final `pass / warn / fail`
3. 约束：
   - install receipt 仍是 canonical install ownership truth
   - verify summary 仍是 canonical post-install verification truth
   - bootstrap summary 只是 convenience handoff artifact，不能冒充 receipt

### 6.5 对目标仓库的实际写入面

`adopt bootstrap` 不应发明新的 repo mutation 类别。除 additive bootstrap summary artifact 外，它只编排 `init`、`doctor --fix`、`adopt apply`、`adopt verify` 这四个现有写入面，因此对目标仓库的实际影响必须跟随现有 contract：

1. 当 `workspace_mode=tool_managed`（默认）时：
   - `init` 会写 `<workspaceRoot>/context/bootstrap/init-manifest.json`
   - `doctor --fix` 会写 `<workspaceRoot>/context/diagnostics/doctor/<doctor-id>.json`
   - 这两个 artifact 默认落在 tool-managed workspace，而不是目标仓库内
   - 目标仓库本身主要由 `adopt apply/verify` 写入 managed installer surface，包括 `AGENTS.md`、`.agents/**`、`.claude/**`、`.github/**`、`.mcp.json`
   - adoption metadata 与 handoff docs 落在 `.repo-ai-governor/adoption/**`，重点包括 `.repo-ai-governor/adoption/docs/**`、`.repo-ai-governor/adoption/guides/**`、`.repo-ai-governor/adoption/installations/<pack-id>/adoption-install.receipt.json`、`.repo-ai-governor/adoption/installations/<pack-id>/adoption-verification.summary.json`
   - per-host staged/apply artifacts 落在 `.repo-ai-governor/adoption/installations/<pack-id>/hosts/<target>/host-export.manifest.json`、`host-apply.report.json` 与 `host-verification.summary.json`
   - 默认不会在目标仓库内创建 repo-local canonical execution workspace、sqlite registries 或 self-host template docs
2. 当显式选择 `--workspace-mode repo_local` 但 profile 仍是 `adopter-complete` 时：
   - `init` 与 `doctor` 的 workspace artifact 会落到目标仓库内 `.repo-ai-governor/context/bootstrap/init-manifest.json` 与 `.repo-ai-governor/context/diagnostics/doctor/<doctor-id>.json`
   - 目标仓库仍只应得到 adopter installer surface，不应顺手 seed self-host canonical templates
3. 只有显式 `--workspace-mode repo_local --adoption-profile self-host-complete` 时：
   - 才额外 seed template-backed repo-local governance surface，例如 `.repo-ai-governor/governor.yaml`、`.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/dev/project-template/**`、`.repo-ai-governor/draft/README.md`
   - 同时初始化最小自托管规范模板面，例如 `.repo-ai-governor/normative_knowledge_sources/**`
   - 同时初始化空白 registries / derived views，例如 `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`、`.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`、`.repo-ai-governor/context/artifact-registry/artifacts.csv` 与 `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
   - 这些文件是空白或模板化 bootstrap surface，不是从宿主仓库复制一份 live execution state

### 6.6 与现有命令结构的实现关系

推荐实现方式是“在进程内编排现有 command/runtime 能力”，而不是 shell-out 再调用一遍 CLI：

1. 保持单进程 artifact wiring 与 error model 一致
2. 复用现有 `CliInitCommand`、`CliDoctorCommand` 与 `CliAdoptCommand` 背后的 executor/runtime seam
3. 在 `apps/cli/src/runtime/**` 下新增专门的 bootstrap orchestrator，而不是把多阶段逻辑塞进 `CliAdoptCommand` 本体

## 7. 核心设计与契约影响

1. `apps/cli` command surface
   - 顶层 `CliCommandName` 保持不变
   - `adopt` subcommand family 增加 `bootstrap`
   - `cli-skeleton` / help tests 只需扩展 adopt 子命令帮助，不需要扩展顶层 catalog family
2. `runtime.governance-clients`
   - 需要新增一层 installer convenience orchestrator
   - 该层只负责 public UX 编排，不拥有新的 install truth
3. `contract.runtime.adoption-pack-install.v1`
   - 原则上不需要为本轮 convenience surface 新建第二份 contract
   - 仅当 promotion 时需要把 “bootstrap summary is additive only”、“bootstrap cannot override workspace mode policy”、“check remains explicit audit follow-up” 或 selector/reentry 的 fail-closed 语义 formalize 进 contract，才更新 contract 文本
4. adopter docs
   - `README.md` 与 `docs/local-adoption-playbook.md` 在实现窗口内可升级为：
     - 快速路径先写 `adopt bootstrap`
     - 展开解释再回链 `init` / `doctor` / `check` / `adopt apply` / `adopt verify`
     - 明确区分 “baseline bootstrap” 与 “installer quickstart”
   - `docs/support-matrix.md` 只应把它写成“已存在 install mode 之上的 convenience command”，不能误写成新的 install mode
5. i18n / CLI copy
   - 需要新增 adopt bootstrap 的帮助文案、结果摘要、stage 状态 copy
   - 不能直接硬编码英文/中文字符串
6. tests / verification
   - 需要扩展 `adopt` help 集成测试
   - 需要新增 bootstrap orchestration 的 command/runtime tests
   - 需要覆盖 selector ambiguity、receipt reentry / drift fail-closed、以及 `check` follow-up guidance
   - clean-room release evidence 可以后置到 rollout follow-up，而不是 draft 本轮先声明已支持

## 8. 风险与权衡

1. 若 convenience surface 把多个阶段压得过扁，用户会看不到哪个阶段失败。
   - 缓解：bootstrap summary 必须保留 stage-level artifact refs 与 per-stage status。
2. 若把 `doctor` warning 一律当成 blocking failure，会误伤 external adopter 仓库。
   - 缓解：显式维护 bootstrap blocking matrix，只阻断真正影响 install safety 的条件。
3. 若 convenience surface顺手把 `connect` 也塞进去，会把 installer 和 onboarding 两条治理链混在一起。
   - 缓解：Phase A 明确只覆盖安装，不覆盖 adapter onboarding。
4. 若把 bootstrap summary 与 install receipt 混淆，会制造新的 truth surface。
   - 缓解：文档、结果模型与 contract 更新都必须重复强调 summary 是 additive artifact。
5. 若选择顶层 `bootstrap` 命令，help/catalog/IDE/示例改动面会更大。
   - 缓解：本方案选择 `adopt bootstrap`，把爆炸半径控制在 installer family 内。
6. 若“bootstrap”一词继续同时指 baseline bootstrap 与 installer quickstart，README/help 很容易制造新的心智冲突。
   - 缓解：固定术语为 `baseline bootstrap` vs `adopt bootstrap installer quickstart`，并在帮助文案中显式保留 `check` follow-up guidance。
7. 若 rerun 语义不清晰，用户会把 `adopt bootstrap` 误当成 `upgrade` 或 cross-pack migration 的别名。
   - 缓解：对 existing receipt、managed drift 与 profile/pack mismatch 全部 fail-closed，并强制回到 `diff/upgrade/remove` lifecycle。

## 9. 分阶段落地建议

1. Phase A
   - 新增 `adopt bootstrap`
   - 内部编排 `init -> doctor --fix -> adopt apply -> adopt verify`
   - 产出 bootstrap summary artifact
   - 固化 `baseline bootstrap` / `installer quickstart` / `check follow-up` 三层文案
   - 更新 `README*`、`docs/local-adoption-playbook*`
2. Phase B
   - 增加更细的 stage option，例如跳过已完成步骤或显式关闭 safe-local fix
   - 为 session shell / capability catalog 增加 installer quickstart discoverability
3. Phase C
   - 根据 adopter 使用反馈，再评估是否需要顶层 alias（例如 `quickstart`）作为纯语法糖
   - 若做 alias，也应明确它只是 `adopt bootstrap` 的别名，而不是新的 lifecycle owner

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.adopter-quickstart-bootstrap-command`
2. 建议 `target_module_ids`：`runtime.governance-clients`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 为什么 convenience surface 应放在 `adopt` family 下，而不是新增顶层命令
   - 是否已经把 `check` 明确保留为 broader governance audit follow-up，而不是让 public truth 从文档里消失
   - bootstrap blocking matrix 是否足够严格但不过度阻断 external adopter
   - selector 缺省 built-in、显式 selector 复用现有 resolver、歧义 fail-closed 这三条是否足够明确
   - existing receipt / drift / profile mismatch 时是否严格回到 `adopt diff/upgrade/remove`，而不是发明平行 upgrade path
   - bootstrap summary artifact 是否与 receipt / verify summary 保持了明确 truth boundary
   - 是否严格保持 `tool_managed` 默认值、`repo_local` 显式 opt-in 与 `self-host-complete` fail-closed 约束
   - 是否明确把 `connect` 排除在 Phase A 外
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
   - 若 review 认为需要 formalize additive artifact / blocking matrix boundary，再补：
     - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
   - `README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` 作为 rollout follow-up consumer surface，同步更新但不进入本条 solution 的 `final_paths`
