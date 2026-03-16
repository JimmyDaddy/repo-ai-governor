export const globalOptionDefinitions = [
  {
    long: "--config",
    key: "config",
    valueName: "path",
    description: "指定主配置文件路径",
    type: "string"
  },
  {
    long: "--cwd",
    key: "cwd",
    valueName: "path",
    description: "指定执行目录",
    type: "string"
  },
  {
    long: "--project",
    key: "project",
    valueName: "slug",
    description: "指定当前执行项目，如 mvp",
    type: "string"
  },
  {
    long: "--sprint",
    key: "sprint",
    valueName: "id",
    description: "指定当前执行 sprint，如 sprint-001",
    type: "string"
  },
  {
    long: "--locale",
    key: "locale",
    valueName: "locale",
    description: "指定输出语言，如 zh-CN、en-US",
    type: "string"
  },
  {
    long: "--format",
    key: "format",
    valueName: "summary|markdown|json",
    description: "指定输出格式",
    type: "string"
  },
  {
    long: "--non-interactive",
    key: "nonInteractive",
    description: "禁止交互提示",
    type: "boolean"
  },
  {
    long: "--verbose",
    key: "verbose",
    description: "输出更多调试信息",
    type: "boolean"
  },
  {
    long: "--quiet",
    key: "quiet",
    description: "仅输出关键结果",
    type: "boolean"
  },
  {
    long: "--dry-run",
    key: "dryRun",
    description: "只预览不落盘",
    type: "boolean"
  }
];

export const commandDefinitions = [
  {
    name: "init",
    description: "初始化仓库治理能力",
    options: [
      {
        long: "--preset",
        key: "preset",
        valueName: "name",
        description: "指定默认规范模板，如 official/base",
        type: "string"
      },
      {
        long: "--language",
        key: "language",
        valueName: "name",
        description: "指定编程语言模板",
        type: "string"
      },
      {
        long: "--adapter",
        key: "adapter",
        valueName: "name",
        description: "预启用一个或多个适配器",
        type: "string",
        multiple: true
      },
      {
        long: "--force",
        key: "force",
        description: "允许覆盖可覆盖文件",
        type: "boolean"
      },
      {
        long: "--self-install",
        key: "selfInstall",
        description: "初始化后将 @cjhdev/repo-ai-governor 写入 package.json 并安装依赖",
        type: "boolean"
      },
      {
        long: "--skip-self-install",
        key: "skipSelfInstall",
        description: "跳过 init 阶段的依赖自安装（默认 npx 模式会自动安装）",
        type: "boolean"
      },
      {
        long: "--skip-skill-install",
        key: "skipSkillInstall",
        description: "跳过 init 阶段的官方 skills 自动安装",
        type: "boolean"
      }
    ]
  },
  {
    name: "skills",
    description: "管理官方 skills 的发现、安装与健康检查",
    arguments: [
      {
        name: "[action]",
        description: "install|list|doctor"
      }
    ],
    options: [
      {
        long: "--surface",
        key: "surface",
        valueName: "codex|github-copilot|claude-code",
        description: "指定 skill 安装或检查的目标 surface",
        type: "string"
      },
      {
        long: "--scope",
        key: "scope",
        valueName: "repo|user",
        description: "指定 repo 级或 user 级安装范围",
        type: "string"
      },
      {
        long: "--skill",
        key: "skill",
        valueName: "id",
        description: "只安装指定 skill，可重复传入",
        type: "string",
        multiple: true
      },
      {
        long: "--target",
        key: "target",
        valueName: "path",
        description: "覆盖默认安装目标目录",
        type: "string"
      },
      {
        long: "--catalog",
        key: "catalog",
        valueName: "path",
        description: "指定官方 skill catalog 路径，便于自定义分发或测试",
        type: "string"
      },
      {
        long: "--force",
        key: "force",
        description: "安装时覆盖已有 skill 目录",
        type: "boolean"
      },
      {
        long: "--strict",
        key: "strict",
        description: "在 doctor 时把 warning 视为失败",
        type: "boolean"
      }
    ]
  },
  {
    name: "doctor",
    description: "检查仓库是否满足运行条件",
    options: [
      {
        long: "--strict",
        key: "strict",
        description: "把警告视为失败",
        type: "boolean"
      },
      {
        long: "--fix",
        key: "fix",
        description: "仅对安全问题执行自动修复",
        type: "boolean"
      }
    ]
  },
  {
    name: "plan",
    description: "生成技术方案和任务拆解",
    options: [
      {
        long: "--input",
        key: "input",
        valueName: "path",
        description: "需求输入文件",
        type: "string"
      },
      {
        long: "--title",
        key: "title",
        valueName: "text",
        description: "任务标题",
        type: "string"
      },
      {
        long: "--out",
        key: "out",
        valueName: "path",
        description: "输出文件路径",
        type: "string"
      },
      {
        long: "--template",
        key: "template",
        valueName: "name",
        description: "指定流程模板",
        type: "string"
      },
      {
        long: "--bundle-dir",
        key: "bundleDir",
        valueName: "path",
        description: "指定项目/sprint 任务产物目录",
        type: "string"
      }
    ]
  },
  {
    name: "check",
    description: "执行治理检查",
    options: [
      {
        long: "--stage",
        key: "stage",
        valueName: "name",
        description: "只检查某个阶段",
        type: "string"
      },
      {
        long: "--changed-only",
        key: "changedOnly",
        description: "仅检查变更内容",
        type: "boolean"
      },
      {
        long: "--write-report",
        key: "writeReport",
        description: "强制写报告文件",
        type: "boolean"
      }
    ]
  },
  {
    name: "review",
    description: "按治理规则执行代码评审检查",
    options: [
      {
        long: "--strict",
        key: "strict",
        description: "把 warning 视为失败，便于在 CI 中阻断",
        type: "boolean"
      },
      {
        long: "--path",
        key: "path",
        valueName: "file-or-dir",
        description: "只评审指定文件或目录",
        type: "string"
      },
      {
        long: "--base",
        key: "base",
        valueName: "ref",
        description: "指定对比基线",
        type: "string"
      },
      {
        long: "--head",
        key: "head",
        valueName: "ref",
        description: "指定对比头部",
        type: "string"
      }
    ]
  },
  {
    name: "review-verify",
    description: "对 review 结果执行复核",
    options: [
      {
        long: "--strict",
        key: "strict",
        description: "把 warning 视为失败，便于在 CI 中阻断",
        type: "boolean"
      },
      {
        long: "--source",
        key: "source",
        valueName: "path",
        description: "指定待复核的 review 结果文件",
        type: "string"
      },
      {
        long: "--path",
        key: "path",
        valueName: "file-or-dir",
        description: "只复核指定文件或目录",
        type: "string"
      },
      {
        long: "--base",
        key: "base",
        valueName: "ref",
        description: "指定对比基线",
        type: "string"
      },
      {
        long: "--head",
        key: "head",
        valueName: "ref",
        description: "指定对比头部",
        type: "string"
      }
    ]
  },
  {
    name: "report",
    description: "渲染执行结果为报告",
    options: [
      {
        long: "--source",
        key: "source",
        valueName: "path",
        description: "指定已有结果文件",
        type: "string"
      },
      {
        long: "--format",
        key: "format",
        valueName: "summary|markdown|json",
        description: "指定输出格式",
        type: "string"
      },
      {
        long: "--out",
        key: "out",
        valueName: "path",
        description: "指定输出路径",
        type: "string"
      }
    ]
  },
  {
    name: "upgrade",
    description: "升级默认模板和配置结构",
    options: [
      {
        long: "--to-version",
        key: "toVersion",
        valueName: "version",
        description: "目标 schema 或模板版本",
        type: "string"
      },
      {
        long: "--preview",
        key: "preview",
        description: "只展示升级结果",
        type: "boolean"
      },
      {
        long: "--backup",
        key: "backup",
        description: "升级前备份原配置",
        type: "boolean"
      }
    ]
  }
];

const commandMap = new Map(commandDefinitions.map((command) => [command.name, command]));

export function getCommandDefinition(name) {
  return commandMap.get(name);
}
