import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

describe("sync-task-ledger.js", () => {
  it("refreshes checklist execution notes from canonical task cards while preserving extra runtime notes", async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), "sync-task-ledger-"));
    const tasksDirPath = resolve(tempRoot, "tasks");
    const taskCardPath = resolve(
      tasksDirPath,
      "TK-130-ledger-single-source-residual-closure-and-auto-sync-generator.md",
    );
    const checklistPath = resolve(tasksDirPath, "checklist.md");
    const csvPath = resolve(tasksDirPath, "tasks.csv");

    try {
      await mkdir(tasksDirPath, { recursive: true });
      await writeFile(
        taskCardPath,
        `# TK-130 \`TK\` 单写源残余收口与自动同步生成器

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: \`project-012-execution-context-optimization\`
- Sprint: \`sprint-002-ledger-review-gate-and-memory-follow-up\`

## 1. 任务目标

完成 ledger sync 收口。

## 9. 执行记录

1. 2026-03-24：新 canonical 摘要。
2. 2026-03-24：第二条 canonical 摘要。
`,
        "utf8",
      );
      await writeFile(
        checklistPath,
        `# checklist

- [x] TK-130 \`TK\` 单写源残余收口与自动同步生成器
  - 2026-03-24：旧 checklist 摘要。
  - 2026-03-24：运行时附加备注。
`,
        "utf8",
      );
      await writeFile(
        csvPath,
        "execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at\n",
        "utf8",
      );

      await execFileAsync(
        process.execPath,
        ["./scripts/governance/sync-task-ledger.js", "--tasks-dir", tasksDirPath],
        {
          cwd: "/Users/jimmydaddy/study/ai-governor",
        },
      );

      await execFileAsync(
        process.execPath,
        [
          "./scripts/governance/sync-task-ledger.js",
          "--tasks-dir",
          tasksDirPath,
          "--task-id",
          "TK-130",
          "--checklist-note",
          "2026-03-24：运行时附加备注。",
        ],
        {
          cwd: "/Users/jimmydaddy/study/ai-governor",
        },
      );

      const checklistContent = await readFile(checklistPath, "utf8");
      expect(checklistContent).toContain("2026-03-24：新 canonical 摘要。");
      expect(checklistContent).toContain("2026-03-24：第二条 canonical 摘要。");
      expect(checklistContent).toContain("2026-03-24：运行时附加备注。");
      expect(checklistContent).not.toContain("2026-03-24：旧 checklist 摘要。");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
