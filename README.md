# Riko-Memory

Rust 优先的 Agent 长期记忆内核及其面向 DeepSeek Harness 的独立记忆 bundle。

## Packages

- [Rust memory kernel and DSH memory bundle](agent-memory/README.md) — `memoryd`、SQLite 存储、记忆协议和 `@agent-memory/dsh-adapter`。

记忆 DSH bundle 的安装与配置步骤见其 README。Riko App Bridge 作为独立项目维护，不包含在本仓库。

## Repository scope

本仓库发布可运行源码、bundle 文件和安装说明。内部设计文档、真实测试记录及本地部署资料不包含在公开发布树中。不要提交 API 密钥、用户令牌或本机数据库。