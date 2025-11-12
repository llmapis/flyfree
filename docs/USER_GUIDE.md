# Flyfree 使用指南

> 完整的 Flyfree 使用教程，从入门到高级应用

## 📚 目录

1. [快速入门](#快速入门)
2. [命令详解](#命令详解)
3. [配置管理](#配置管理)
4. [内置 Provider](#内置-provider)
5. [高级用法](#高级用法)
6. [故障排除](#故障排除)
7. [最佳实践](#最佳实践)

## 🚀 快速入门

### 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: macOS, Linux, Windows

### 安装 Flyfree

#### 方法 1: 全局安装（推荐）

```bash
npm install -g flyfree
```

安装后可以使用 `ff` 或 `flyfree` 命令：

```bash
ff --help
flyfree --version
```

#### 方法 2: 使用 npx

```bash
npx flyfree --help
```

### 验证安装

```bash
ff --version
# 输出: flyfree/0.2.0 darwin-x64 node-v18.17.0
```

### 第一次使用

#### 1. 订阅智谱AI Provider

```bash
# 注册智谱AI账号并获取 API Key
# 访问: https://open.bigmodel.cn/

ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
```

> ⚠️ **注意**: URL 必须用引号包裹，避免 shell 解析特殊字符

#### 2. 查看订阅状态

```bash
ff list
```

输出示例：
```
📦 Subscribed Providers:

🟢 zhipu (Z.AI)
   └── claude-code ✅ Active
   └── Last updated: 2024-11-12 10:30:45

💡 Use 'ff switch' to change configurations
```

#### 3. 切换配置

```bash
ff switch
```

交互式界面让你选择 Provider 和 Agent。

## 🔧 命令详解

### subscribe (sub) - 订阅 Provider

订阅并管理 LLM Provider 配置。

```bash
ff sub <url> [options]
```

**参数**:
- `<url>`: 订阅 URL，支持 `https://` 和 `ff://` 协议

**选项**:
- `-a, --alias <name>`: 设置 Provider 别名
- `--auto`: 自动应用配置（跳过确认）
- `-s, --select [agents]`: 选择要应用的 Agent

#### 示例

```bash
# 基础订阅
ff sub https://api.example.com/config

# 使用别名
ff sub https://api.example.com/config -a myProvider

# 自动应用所有配置
ff sub 'ff://z.ai?key=KEY' -a zhipu --auto

# 交互式选择 Agent
ff sub https://api.example.com/config -a provider --select

# 指定特定 Agent
ff sub https://api.example.com/config -a provider --select claude-code,codex
```

#### 内置 Provider 协议

使用 `ff://` 协议订阅内置 Provider：

```bash
# 智谱AI
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu

# OpenRouter  
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter
```

### list (ls) - 查看订阅

显示所有已订阅的 Provider 和状态信息。

```bash
ff list
ff ls  # 简写
```

输出信息包括：
- Provider 名称和状态
- 支持的 Agent
- 最后更新时间
- 当前活跃配置

### switch (s) - 交互式切换

通过交互式界面切换 Provider 配置。

```bash
ff switch
ff s  # 简写
```

交互流程：
1. 选择 Provider
2. 选择 Agent
3. 确认应用配置

### set - 快速切换

直接指定 Agent 和 Provider 进行快速切换。

```bash
ff set <agent> <provider>
```

**参数**:
- `<agent>`: Agent 名称（如 `claude-code`）
- `<provider>`: Provider 名称（如 `zhipu`）

#### 示例

```bash
# 将 claude-code 切换到智谱AI
ff set claude-code zhipu

# 将 codex 切换到 OpenRouter
ff set codex openrouter
```

### reset - 重置配置

将 Agent 配置重置为空状态。

```bash
ff reset [agent] [options]
```

**参数**:
- `[agent]`: 可选，指定要重置的 Agent

**选项**:
- `-f, --force`: 强制重置，跳过确认

#### 示例

```bash
# 交互式选择要重置的 Agent
ff reset

# 重置指定 Agent
ff reset claude-code

# 强制重置
ff reset claude-code --force
```

### restore - 恢复配置

从备份恢复 Agent 配置。

```bash
ff restore [agent] [options]
```

**参数**:
- `[agent]`: 可选，指定要恢复的 Agent

**选项**:
- `-l, --list`: 列出所有可用备份

#### 示例

```bash
# 列出所有备份
ff restore --list

# 交互式恢复
ff restore

# 恢复指定 Agent
ff restore claude-code
```

### unsubscribe (unsub) - 取消订阅

取消订阅指定的 Provider。

```bash
ff unsub <provider> [options]
```

**参数**:
- `<provider>`: 要取消订阅的 Provider 名称

**选项**:
- `-f, --force`: 强制取消，跳过确认

#### 示例

```bash
# 取消订阅（需要确认）
ff unsub myProvider

# 强制取消订阅
ff unsub myProvider --force
```

## 📁 配置管理

### 配置文件位置

Flyfree 将所有配置存储在 `~/.ff/` 目录下：

```
~/.ff/
├── sub.json                    # 订阅信息
├── backups/                    # 配置备份
│   └── claude-code/
│       └── 1699856845123.json
└── {provider-name}/           # Provider 配置
    ├── config.json           
    ├── claude-code/
    │   └── config.json
    └── codex/
        └── config.json
```

### 订阅配置 (sub.json)

记录所有订阅信息和当前设置：

```json
{
  "subscribes": {
    "zhipu": {
      "sub_url": "ff://z.ai?key=***",
      "providers": ["claude-code", "codex"],
      "status": "success",
      "updated_at": 1699856845123,
      "hash": "abc123...",
      "latest_response_message": ""
    }
  },
  "setting": {
    "claude-code": {
      "provider": "zhipu"
    }
  }
}
```

### Agent 配置文件

每个 Agent 都有独立的配置文件：

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "anthropic": {
    "apiKey": "your-api-key",
    "baseURL": "https://open.bigmodel.cn/api/paas/v4/anthropic"
  },
  "modelName": "claude-3-5-sonnet-20241022"
}
```

**Codex** (配置路径待定):
```json
{
  "openai": {
    "apiKey": "your-api-key",
    "baseURL": "https://open.bigmodel.cn/api/paas/v4"
  },
  "model": "gpt-4"
}
```

### 备份机制

- **自动备份**: 每次配置变更前自动创建备份
- **保留策略**: 最多保留 10 个备份文件
- **备份格式**: 时间戳命名的 JSON 文件
- **恢复功能**: 可选择任意备份进行恢复

## 🔌 内置 Provider

### 智谱AI (Z.AI)

国产 LLM 服务提供商，支持 Claude 和 GPT 模型。

```bash
# 订阅智谱AI
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
```

**支持的 Agent**:
- `claude-code`: Claude 3.5 Sonnet
- `codex`: GPT-4

**API Key 获取**:
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册账号并完成实名认证
3. 创建应用并获取 API Key

### OpenRouter

多模型聚合平台，支持多种 LLM 模型。

```bash
# 订阅 OpenRouter
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```

**支持的 Agent**:
- `claude-code`: Anthropic Claude 3.5 Sonnet

**API Key 获取**:
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并验证邮箱
3. 在设置页面生成 API Key

### 自定义 Provider

支持任何兼容 OpenAI/Anthropic API 的服务：

```bash
# 订阅自定义服务
ff sub https://your-api-server.com/config -a custom
```

## 🎯 高级用法

### 环境变量

- `DEBUG=1`: 启用调试日志
- `FF_CONFIG_DIR`: 自定义配置目录（默认 `~/.ff`）

```bash
# 调试模式
DEBUG=1 ff sub https://example.com/config

# 自定义配置目录
FF_CONFIG_DIR=/path/to/config ff list
```

### 批量操作

#### 批量订阅

```bash
#!/bin/bash
# 批量订阅脚本

providers=(
  "'ff://z.ai?key=$ZHIPU_KEY' -a zhipu"
  "'ff://openrouter?key=$OPENROUTER_KEY' -a openrouter"
  "https://custom.com/config -a custom"
)

for provider in "${providers[@]}"; do
  eval "ff sub $provider --auto"
done
```

#### 配置切换脚本

```bash
#!/bin/bash
# 根据时间自动切换 Provider

hour=$(date +%H)

if [ $hour -ge 9 ] && [ $hour -lt 18 ]; then
  # 工作时间使用高质量 Provider
  ff set claude-code openrouter
else
  # 非工作时间使用经济型 Provider  
  ff set claude-code zhipu
fi
```

### JSON 配置模板

创建标准化的 Provider 配置：

```json
{
  "name": "My Custom Provider",
  "payload": {
    "providers": [
      {
        "name": "claude-code",
        "hash": "config-hash",
        "setting": {
          "anthropic": {
            "apiKey": "${API_KEY}",
            "baseURL": "https://api.custom.com/v1"
          },
          "modelName": "claude-3-5-sonnet-20241022"
        }
      }
    ],
    "functions": ["balance", "usage"]
  }
}
```

### 配置验证

Flyfree 使用 JSON Schema 验证配置：

```typescript
const configSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    payload: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              hash: { type: 'string' },
              setting: { type: 'object' }
            },
            required: ['name', 'setting']
          }
        }
      },
      required: ['providers']
    }
  },
  required: ['name', 'payload']
};
```

## 🔍 故障排除

### 常见问题

#### 1. 订阅失败

**错误信息**: `Subscription failed: Invalid JSON response`

**解决方法**:
1. 检查 URL 是否正确
2. 验证网络连接
3. 确认 API 服务可用

```bash
# 启用调试模式查看详细错误
DEBUG=1 ff sub https://example.com/config
```

#### 2. API Key 无效

**错误信息**: `API key is required`

**解决方法**:
1. 确认 API Key 格式正确
2. 检查 Key 是否已过期
3. 验证 Key 权限设置

```bash
# 检查 API Key 格式
ff sub 'ff://z.ai?key=YOUR_ACTUAL_KEY' -a test
```

#### 3. Agent 配置路径错误

**错误信息**: `No config path mapping found for agent: xxx`

**解决方法**:
1. 确认 Agent 已安装
2. 检查配置文件路径
3. 手动创建配置目录

```bash
# 检查 Claude Code 配置路径
ls -la ~/.claude/settings.json
```

#### 4. 权限问题

**错误信息**: `Permission denied`

**解决方法**:
1. 检查文件权限
2. 确认目录可写
3. 使用适当的用户权限

```bash
# 修复权限
chmod 755 ~/.ff/
chmod 644 ~/.ff/sub.json
```

### 调试技巧

#### 1. 启用详细日志

```bash
DEBUG=1 ff <command>
```

#### 2. 检查配置文件

```bash
# 查看订阅信息
cat ~/.ff/sub.json | jq

# 查看 Provider 配置
cat ~/.ff/zhipu/config.json | jq

# 查看 Agent 配置
cat ~/.claude/settings.json | jq
```

#### 3. 验证网络连接

```bash
# 测试 API 端点连接
curl -I https://open.bigmodel.cn/api/paas/v4/anthropic

# 测试配置 URL
curl https://your-config-server.com/config
```

#### 4. 重置配置

```bash
# 完全重置
rm -rf ~/.ff/
ff sub 'ff://z.ai?key=KEY' -a zhipu --auto
```

### 日志分析

Flyfree 提供详细的操作日志：

```bash
# 订阅日志
✓ Fetching configuration from: ff://z.ai?key=***
✓ Built-in provider response received
✓ Configuration validated successfully
✓ Backup created: ~/.ff/backups/claude-code/1699856845123.json
✓ Configuration applied to claude-code
✓ Subscription completed successfully!

# 错误日志  
✗ Subscription failed: Network timeout
✗ Validation failed: Invalid JSON schema
✗ Backup creation failed: Permission denied
```

## 💡 最佳实践

### 1. API Key 管理

#### 环境变量方式（推荐）

```bash
# 设置环境变量
export ZHIPU_API_KEY="your_zhipu_key"
export OPENROUTER_API_KEY="your_openrouter_key"

# 使用环境变量
ff sub "ff://z.ai?key=$ZHIPU_API_KEY" -a zhipu --auto
```

#### 配置文件方式

```bash
# ~/.ffrc
ZHIPU_KEY=your_zhipu_key
OPENROUTER_KEY=your_openrouter_key

# 加载配置
source ~/.ffrc
ff sub "ff://z.ai?key=$ZHIPU_KEY" -a zhipu --auto
```

### 2. 团队协作

#### 配置标准化

```bash
# team-setup.sh
#!/bin/bash

echo "Setting up team LLM configuration..."

# 统一订阅团队 Provider
ff sub https://team-config.company.com/llm -a team-standard --auto

# 设置默认配置
ff set claude-code team-standard

echo "Team configuration completed!"
```

#### 配置共享

```json
// team-config.json
{
  "name": "Team Standard Config",
  "payload": {
    "providers": [
      {
        "name": "claude-code",
        "setting": {
          "anthropic": {
            "apiKey": "${TEAM_API_KEY}",
            "baseURL": "https://api.company.com/anthropic"
          }
        }
      }
    ]
  }
}
```

### 3. 成本控制

#### Provider 切换策略

```bash
#!/bin/bash
# cost-optimizer.sh

# 获取当前月份使用量
usage=$(ff usage claude-code 2>/dev/null || echo "0")

# 根据使用量选择 Provider
if [ "$usage" -gt 1000 ]; then
  echo "High usage detected, switching to cost-effective provider..."
  ff set claude-code zhipu
else
  echo "Normal usage, using premium provider..."
  ff set claude-code openrouter
fi
```

#### 使用监控

```bash
# 定期检查 Provider 状态
ff list | grep -E "(Active|Failed)"

# 备份关键配置
cp ~/.ff/sub.json ~/.ff/sub.json.backup.$(date +%Y%m%d)
```

### 4. 自动化脚本

#### 配置同步

```bash
#!/bin/bash
# sync-config.sh

# 备份当前配置
ff restore --list > backup-$(date +%Y%m%d).log

# 更新所有订阅
providers=$(ff list --json | jq -r '.[] | .name')

for provider in $providers; do
  echo "Updating $provider..."
  ff sub $(ff list --json | jq -r ".[] | select(.name==\"$provider\") | .url") -a $provider --auto
done

echo "Configuration sync completed!"
```

#### 健康检查

```bash
#!/bin/bash
# health-check.sh

# 检查 Flyfree 安装
if ! command -v ff &> /dev/null; then
  echo "❌ Flyfree not installed"
  exit 1
fi

# 检查配置目录
if [ ! -d ~/.ff ]; then
  echo "❌ Configuration directory missing"
  exit 1
fi

# 检查活跃配置
active_providers=$(ff list | grep "Active" | wc -l)
if [ "$active_providers" -eq 0 ]; then
  echo "⚠️  No active providers"
else
  echo "✅ $active_providers active provider(s)"
fi

echo "Health check completed!"
```

### 5. 性能优化

#### 缓存配置

```bash
# 预加载常用配置
ff sub 'ff://z.ai?key=$ZHIPU_KEY' -a zhipu
ff sub 'ff://openrouter?key=$OPENROUTER_KEY' -a openrouter

# 快速切换
alias ff-zhipu="ff set claude-code zhipu"
alias ff-openrouter="ff set claude-code openrouter"
```

#### 批量操作优化

```bash
# 并行订阅（谨慎使用）
{
  ff sub 'ff://z.ai?key=$ZHIPU_KEY' -a zhipu &
  ff sub 'ff://openrouter?key=$OPENROUTER_KEY' -a openrouter &
  wait
}
```

---

## 📞 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

1. **查看内置帮助**: `ff --help`
2. **阅读文档**: [docs/](docs/) 目录
3. **提交 Issue**: [GitHub Issues](https://github.com/wangboyan/flyfree/issues)
4. **社区讨论**: [GitHub Discussions](https://github.com/wangboyan/flyfree/discussions)

---

*本指南最后更新：2024-11-12*