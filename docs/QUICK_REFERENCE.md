# Flyfree 快速参考

> 常用命令和配置的速查手册

## 🚀 基础命令

| 命令 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `ff sub <url>` | - | 订阅 Provider | `ff sub 'ff://z.ai?key=KEY' -a zhipu` |
| `ff list` | `ff ls` | 查看订阅 | `ff list` |
| `ff switch` | `ff s` | 交互式切换 | `ff switch` |
| `ff set <endpoint> <key> <model>` | - | 自定义配置 | `ff set https://api.com/v1 sk-xxx model -a name` |
| `ff reset [agent]` | - | 重置配置 | `ff reset claude-code` |
| `ff restore [agent]` | - | 恢复配置 | `ff restore --list` |
| `ff unsub <provider>` | - | 取消订阅 | `ff unsub zhipu` |

## 🔌 内置 Providers

### 智谱AI (Z.AI)
```bash
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
```
- **获取 Key**: [open.bigmodel.cn](https://open.bigmodel.cn/)
- **支持**: claude-code, codex

### OpenRouter
```bash
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```
- **获取 Key**: [openrouter.ai](https://openrouter.ai/)
- **支持**: claude-code

### 自定义 Provider
```bash
ff set <endpoint> <api-key> <model> -a <name>
```
- **示例**: `ff set https://api.example.com/v1 sk-xxx claude-3-5-sonnet -a custom`
- **支持**: claude-code, codex（交互式选择）
- **适用**: 任意兼容 Anthropic/OpenAI API 的服务

## 📁 配置文件路径

```
~/.ff/                          # Flyfree 配置目录
├── sub.json                    # 订阅信息
├── backups/                    # 自动备份
└── {provider}/                 # Provider 配置

~/.claude/settings.json         # Claude Code 配置
```

## ⚙️ 常用选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-a, --alias <name>` | 设置别名 | `ff sub url -a myProvider` |
| `--auto` | 自动应用 | `ff sub url --auto` |
| `-s, --select` | 选择 Agent | `ff sub url --select` |
| `-f, --force` | 强制操作 | `ff reset agent --force` |
| `-l, --list` | 列出项目 | `ff restore --list` |

## 🔧 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DEBUG=1` | 启用调试 | `DEBUG=1 ff sub url` |
| `FF_CONFIG_DIR` | 配置目录 | `FF_CONFIG_DIR=/path ff list` |

## 💡 快捷脚本

### 快速设置
```bash
# 一键设置智谱AI
ff sub 'ff://z.ai?key=$ZHIPU_KEY' -a zhipu --auto

# 快速切换
alias ff-zhipu="ff set claude-code zhipu"
alias ff-or="ff set claude-code openrouter"
```

### 状态检查
```bash
# 检查当前配置
ff list

# 查看备份
ff restore --list

# 测试连接
DEBUG=1 ff set claude-code zhipu
```

## 🆘 故障排除

| 问题 | 解决方案 |
|------|----------|
| 订阅失败 | `DEBUG=1 ff sub url` 查看详细错误 |
| API Key 无效 | 检查 Key 格式和权限 |
| 权限错误 | `chmod 755 ~/.ff/` |
| 配置丢失 | `ff restore` 恢复备份 |

## 📊 配置格式

### 订阅响应格式
```json
{
  "name": "Provider Name",
  "payload": {
    "providers": [{
      "name": "claude-code",
      "hash": "config-hash",
      "setting": { /* 配置内容 */ }
    }],
    "functions": []
  }
}
```

### Claude Code 配置
```json
{
  "anthropic": {
    "apiKey": "your-key",
    "baseURL": "https://api.example.com"
  },
  "modelName": "claude-3-5-sonnet-20241022"
}
```

---

📖 **完整文档**: [USER_GUIDE.md](USER_GUIDE.md)  
🐛 **问题反馈**: [GitHub Issues](https://github.com/wangboyan/flyfree/issues)