# Riko-Memory

Rust 优先的 Agent 长期记忆内核，以及面向 DeepSeek Harness 的两个可独立安装 bundle。

## Packages

- [Rust memory kernel and DSH memory bundle](agent-memory/README.md) — `memoryd`、SQLite 存储、记忆协议和 `@agent-memory/dsh-adapter`。
- [Riko App Bridge](riko-app-bridge/README.md) — 独立的 `@riko/riko-app-api` DSH bundle，提供 Riko Android app 使用的 API 与模型设置接线。

两个 DSH bundle 可以安装在同一个 profile 中，安装与配置步骤分别见各自 README。Bridge 不会自动安装或启用记忆适配器。

## Repository scope

本仓库发布可运行源码、bundle 文件和安装说明。内部设计文档、真实测试记录及本地部署资料不包含在公开发布树中。不要提交 API 密钥、用户令牌或本机数据库。