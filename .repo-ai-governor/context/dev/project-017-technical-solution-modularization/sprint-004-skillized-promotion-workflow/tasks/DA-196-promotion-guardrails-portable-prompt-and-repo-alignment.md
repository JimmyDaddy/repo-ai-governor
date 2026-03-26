# DA-196 promotion guardrails、portable prompt and repo alignment

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-196`
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-004-skillized-promotion-workflow`

## 1. Summary

1. skill 已补齐 guardrails，禁止无 review、无 gate 或旁路事实源的 promotion。
2. 已提供 portable prompt，便于不支持 skill 文件夹加载的 surface 直接复用。
3. 已补齐 `agents/openai.yaml`，使 skill 可在 UI 中被发现和触发。

## 2. Key Outputs

1. [technical-solution-promotion SKILL.md](/Users/jimmydaddy/study/ai-governor/.codex/skills/technical-solution-promotion/SKILL.md)
2. [technical-solution-promotion openai.yaml](/Users/jimmydaddy/study/ai-governor/.codex/skills/technical-solution-promotion/agents/openai.yaml)

## 3. Follow-Up Constraints

1. 如果后续新增 promotion automation 脚本，skill 应优先编排已有脚本，而不是复制一套新规则。
