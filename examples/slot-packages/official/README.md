# Official Example Slot Package

该目录提供 `TK-303` 落地的两份官方示例插槽：

1. `official-security-review.yaml`
2. `official-documentation-output.yaml`

推荐接入方式：

1. 复制 YAML 文件到目标仓库的 `.repo-ai-governor/slots/`
2. 在 `.repo-ai-governor/governor.yaml` 中启用：

```yaml
slots:
  enabled:
    - official-security-review
    - official-documentation-output
```

3. 结合 `scripts/acceptance/run-mvp-acceptance.sh` 或 `examples/mvp-acceptance/` 里的样例一起验证
