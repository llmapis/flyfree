# Flyfree

[English](README.md) | 简体中文

📋 **[支持的内置提供商](#可用的内置提供商)** | 📖 [文档](#-文档)

> 用于管理 AI 代理（如 Claude Code 和 Codex）LLM 提供商配置的 CLI 工具

Flyfree（自由飞翔）帮助您轻松管理和切换多个 AI Agent 的不同 LLM 提供商配置。它充当用户与 LLM 平台之间的桥梁，实现无缝配置管理和快速平台集成。
Flyfree 不仅简化了用户接入 LLM API 供应商的步骤，同时也简化了 LLM 供应商的接入文档。

## 使用 Flyfree 前后对比

### 不使用 Flyfree（传统方式）

以 MiniMax 集成 Codex CLI 为例，用户需要：

1. **安装 Codex CLI**

   ```bash
   npm i -g @openai/codex
   ```

2. **手动创建并配置配置文件** `~/.codex/config.toml`：

   ```toml
   [model_providers.minimax]
   name = "MiniMax Chat Completions API"
   base_url = "https://api.minimax.io/v1"
   env_key = "MINIMAX_API_KEY"
   wire_api = "chat"
   requires_openai_auth = false
   request_max_retries = 4
   stream_max_retries = 10
   stream_idle_timeout_ms = 300000

   [profiles.m2]
   model = "codex-MiniMax-M2"
   model_provider = "minimax"
   ```

3. **手动设置环境变量**

   ```bash
   export MINIMAX_API_KEY="<YOUR_API_KEY>"
   ```

4. **使用 profile 启动 Codex**
   ```bash
   codex --profile m2
   ```

**痛点：**

- 需要了解代理特定的配置格式（TOML、JSON 等）
- 必须手动定位和管理配置文件路径
- 为每个代理重复此过程（Codex、Claude Code 等）
- 缺乏多提供商的集中管理

### 使用 Flyfree ✨

只需 **2 条简单命令**：

```bash
# 1. 安装 Flyfree
npm i -g @llmapis/flyfree

# 2. 订阅并自动应用
ff sub 'ff://minimax?key={YOUR_MINIMAX_API_KEY}' --auto
```

**优势：**

- ✅ 无需了解代理配置格式
- ✅ 无需知道配置文件路径
- ✅ 自动注入环境变量
- ✅ 对所有代理（Codex、Claude Code 等）使用相同方式
- ✅ 集中管理提供商
- ✅ 轻松切换不同提供商

这种简单性同样适用于 Claude Code 和任何其他支持的代理！

## 📖 文档

- 📑 **[项目概览与特性](docs/FEATURED.md)** - 全面的项目介绍
- 📘 **[用户指南](docs/USER_GUIDE.md)** - 完整的使用文档
- ⚡ **[快速参考](docs/QUICK_REFERENCE.md)** - 命令速查表
- 🔌 **[内置提供商](docs/BUILTIN_PROVIDERS.md)** - 内部提供商系统指南

## 特性

- 🔄 通过 URL 或内置提供商订阅配置
- 🎯 交互式配置切换
- ⚡ 使用 `set` 命令快速切换提供商
- 🔄 配置备份和恢复功能
- 🧹 带备份保护的安全配置重置
- 📦 支持多个代理（Claude Code、Codex 等）
- 🔒 JSON Schema 验证
- 🎨 美观的 CLI 界面
- 🔌 使用 `ff://` 协议支持内置提供商
- 📋 使用 `--select` 选项选择代理
- 🔢 自动备份管理（每个代理最多 10 个备份）

## 安装

```bash
npm install -g @llmapis/flyfree
```

或直接使用 npx：

```bash
npx flyfree <command>
```

## 快速开始

### 1. 订阅提供商

```bash
# 订阅外部提供商配置
ff sub https://your-provider.com/config

# 使用自定义别名订阅
ff sub https://your-provider.com/config -a my-provider

# 订阅并自动应用配置
ff sub https://your-provider.com/config --auto

# 订阅内置提供商（使用 ff:// 协议）
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```

### 2. 列出订阅

```bash
# 列出所有已订阅的提供商
ff list

# 或使用简短别名
ff ls
```

### 3. 切换配置

```bash
# 交互式配置切换
ff switch

# 或使用简短别名
ff s
```

### 4. 取消订阅

```bash
# 取消订阅提供商（带确认）
ff unsub myProvider

# 强制取消订阅（无确认）
ff unsub myProvider --force
```

## 命令

### `ff sub <url> [options]`

订阅提供商配置。

**参数：**

- `url` - 订阅 URL

**选项：**

- `-a, --alias <name>` - 设置提供商别名
- `--auto` - 自动应用配置，无需确认

**示例：**

```bash
ff sub https://example.com/config -a myProvider --auto
```

### `ff list`（别名：`ff ls`）

列出所有已订阅的提供商及其状态。

此命令显示：

- 所有已订阅的提供商
- 订阅状态（成功/失败/待处理）
- 最后更新时间
- 支持的代理
- 当前活动的配置

**示例：**

```bash
ff list
```

### `ff switch`（别名：`ff s`）

交互式切换提供商配置。

此命令将：

1. 显示所有已订阅的提供商
2. 让您选择一个提供商
3. 显示该提供商的可用代理
4. 应用选定的代理配置（需确认）

### `ff set <agent> <provider>`

快速切换代理提供商配置。

**参数：**

- `agent` - 要切换的代理名称
- `provider` - 目标提供商名称

**示例：**

```bash
# 将 claude-code 切换到使用智谱提供商
ff set claude-code ZhiPu

# 将 claude-code 切换到使用 OpenRouter 提供商
ff set claude-code OpenRouter
```

### `ff reset [agent] [options]`

将代理配置重置为空状态。

**参数：**

- `agent` - 要重置的代理名称（可选，将显示交互式选择）

**选项：**

- `-f, --force` - 强制重置，无需确认

**示例：**

```bash
# 交互式选择要重置的代理
ff reset

# 重置特定代理（需确认）
ff reset claude-code

# 强制重置（无确认）
ff reset claude-code --force
```

### `ff restore [agent] [options]`

从备份中恢复代理配置。

**参数：**

- `agent` - 要恢复的代理名称（可选，将显示交互式选择）

**选项：**

- `-l, --list` - 列出所有可用备份

**示例：**

```bash
# 列出所有备份
ff restore --list

# 交互式恢复
ff restore

# 恢复特定代理
ff restore claude-code
```

### `ff unsub <provider> [options]`

取消订阅提供商。

**参数：**

- `provider` - 要取消订阅的提供商名称

**选项：**

- `-f, --force` - 强制取消订阅，无需确认

**示例：**

```bash
# 需要确认
ff unsub myProvider

# 无需确认
ff unsub myProvider --force
```

**注意：** 取消订阅将：

- 从 `~/.ff/` 中删除提供商配置
- 从订阅列表中清除提供商
- 清除受影响的代理设置
- 不会修改实际的代理配置文件

## 内置提供商

Flyfree 使用 `ff://` 协议内置了提供商支持。这些提供商不需要外部 API 端点 - 配置是在内部生成的。  
内置供应商的目的是在项目初期提供用户侧单方使用 Flyfree 的便捷性，Flyfree 希望供应商能够实现订阅协议，让用户通过平台自身 API 进行 Agents 配置订阅

### 可用的内置提供商

| provider | protocol                        | claude-code | codex |
| -------- | ------------------------------- | ----------- | ----- |
| minimax  | ff://minimax?key={YOUR API KEY} | √           | √     |
| z.ai     | ff://z.ai?key={YOUR API KEY}    | √           | ×     |

### 添加自定义内置提供商

您可以通过在 [src/core/builtin-providers.ts](src/core/builtin-providers.ts) 中注册新提供商来扩展内置提供商系统：

```typescript
builtinProviders.register({
  id: "my-provider",
  name: "我的自定义提供商",
  description: "我的自定义提供商描述",
  requiresApiKey: true,
  apiKeyParam: "key",

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error("需要 API 密钥");
    }

    return {
      name: "我的自定义提供商",
      description: "提供商描述",
      payload: {
        providers: [
          {
            name: "claude-code",
            hash: calculateObjectHash(setting),
            setting: {
              // 您的配置在这里
            },
          },
        ],
        functions: [],
      },
    };
  },
});
```

## 配置结构

Flyfree 将所有配置存储在 `~/.ff/` 中：

```
~/.ff/
├── sub.json                    # 订阅信息
├── backups/                    # 配置备份
│   └── claude-code/
│       └── 1234567890.json
└── {provider-name}/
    ├── config.json             # 提供商配置
    ├── claude-code/
    │   └── config.json         # Claude Code 代理配置
    └── codex/
        └── config.json         # Codex 代理配置
```

### sub.json 结构

```json
{
  "subscribes": {
    "provider-name": {
      "sub_url": "https://example.com/config",
      "providers": ["claude-code", "codex"],
      "status": "success",
      "updated_at": 1234567890,
      "hash": "abc123...",
      "latest_response_message": ""
    }
  },
  "setting": {
    "claude-code": {
      "provider": "provider-name"
    }
  }
}
```

## 订阅协议

提供商应返回以下结构的 JSON 响应：

```json
{
  "meta": {
    "code": "错误代码",
    "error": "错误消息"
  },
  "data": {
    "name": "provider-name",
    "description": "提供商描述",
    "payload": {
      "providers": [
        {
          "name": "claude-code",
          "hash": "配置哈希",
          "setting": {
            // 代理特定配置
          }
        }
      ],
      "functions": ["balance", "usage"]
    }
  }
}
```

详细的协议规范请参阅 [docs/protocol.md](docs/protocol.md)。

## 支持的代理

当前支持的代理：

- **Claude Code** (`~/.claude/settings.json`)
- **Codex** (`~/.codex/config.toml`)

您可以通过编辑源代码中的路径映射来添加更多代理。

## 环境变量

- `DEBUG=1` - 启用调试日志

## 开发

```bash
# 克隆仓库
git clone https://github.com/llmapis/flyfree.git
cd flyfree

# 安装依赖
npm install

# 构建
npm run build

# 本地运行
node dist/index.js --help

# 开发模式（监听）
npm run dev
```

## 示例

### 示例 1：订阅并自动应用

```bash
# 订阅提供商并自动应用所有配置
ff sub https://api.example.com/llm-config -a example --auto
```

### 示例 2：手动配置切换

```bash
# 订阅但不自动应用
ff sub https://api.example.com/llm-config

# 稍后，交互式切换配置
ff switch
```

### 示例 3：多个提供商

```bash
# 订阅多个提供商
ff sub https://provider-a.com/config -a providerA
ff sub https://provider-b.com/config -a providerB

# 在它们之间切换
ff switch
```

## 备份与安全

Flyfree 在修改任何代理配置之前会自动创建备份：

- 备份存储在 `~/.ff/backups/{agent-name}/{timestamp}.json`
- 默认情况下，保留最后 10 个备份
- 原始配置永远不会在未经确认的情况下修改（除非使用 `--auto`）

## 故障排除

### 未找到配置路径映射

如果您看到此警告，说明该代理尚未在 Flyfree 中配置。您可以：

1. 检查该代理是否受支持
2. 在源代码中手动添加路径映射
3. 提交 issue 请求支持该代理

### 订阅失败

常见原因：

- 无效的 URL 或网络问题
- 无效的 JSON 响应格式
- 服务器超时

启用调试模式以查看详细的错误信息：

```bash
DEBUG=1 ff sub https://example.com/config
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

MIT

## 作者

用 ❤️ 为 AI 编码社区创建
