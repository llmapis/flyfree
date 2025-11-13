# How to Become a Flyfree Provider

## 概述

成为Flyfree提供商非常简单：您只需要实现一个HTTP接口，返回标准JSON格式的配置信息即可。用户通过Flyfree CLI工具订阅您的服务，自动应用配置到他们的AI代理。

## 核心要求：实现一个getConfig接口

您只需要实现一个HTTP端点（类似getConfig），返回固定的JSON格式。用户通过 `ff sub https://your-provider.com/getConfig` 订阅您的服务。

### 接口规范

**端点**: 任何可访问的HTTPS URL
**方法**: GET
**返回格式**: JSON

### 返回的JSON格式

```json
{
  "name": "your-provider-name",
  "description": "您的提供商描述",
  "payload": {
    "providers": [
      {
        "name": "claude-code",
        "hash": "unique-config-hash",
        "setting": {
          "env": {
            "ANTHROPIC_AUTH_TOKEN": "sk-your-api-key",
            "ANTHROPIC_BASE_URL": "https://api.your-provider.com"
          }
        }
      }
    ],
    "functions": ["balance", "usage"]
  }
}
```

### 字段说明

- **name**: 提供商名称（用户可见）
- **description**: 提供商描述
- **payload.providers**: 支持的AI代理配置列表
  - **name**: 代理名称（当前支持: claude-code）
  - **hash**: 配置的唯一标识符（任何字符串即可）
  - **setting**: 代理的具体配置
    - **env**: 环境变量配置
- **functions**: 可选功能列表（如: ["balance", "usage"]）

## 简单实现示例

### 最简单的实现（Node.js）

```javascript
const express = require('express');
const app = express();

// 实现getConfig接口
app.get('/getConfig', (req, res) => {
  res.json({
    name: "my-provider",
    description: "我的LLM服务",
    payload: {
      providers: [
        {
          name: "claude-code",
          hash: "config-123",
          setting: {
            env: {
              ANTHROPIC_AUTH_TOKEN: "sk-your-api-key",
              ANTHROPIC_BASE_URL: "https://api.example.com"
            }
          }
        }
      ],
      functions: ["balance", "usage"]
    }
  });
});

app.listen(3000, () => {
  console.log('Provider running on port 3000');
});
```

### 支持用户API密钥

```javascript
app.get('/getConfig', (req, res) => {
  const userApiKey = req.query.key || "default-key";

  res.json({
    name: "my-provider",
    description: "我的LLM服务",
    payload: {
      providers: [
        {
          name: "claude-code",
          hash: "config-" + userApiKey.slice(-8),
          setting: {
            env: {
              ANTHROPIC_AUTH_TOKEN: userApiKey,
              ANTHROPIC_BASE_URL: "https://api.example.com"
            }
          }
        }
      ],
      functions: ["balance", "usage"]
    }
  });
});
```

## 部署要求

#### 技术要求
- **协议**: HTTPS必须
- **响应时间**: 建议小于5秒
- **格式**: JSON，UTF-8编码
- **HTTP状态码**:
  - 200: 成功
  - 4xx: 客户端错误
  - 5xx: 服务器错误

#### 安全考虑
- 实现API密钥验证
- 添加速率限制
- 使用HTTPS加密传输
- 记录访问日志

#### 示例实现

```javascript
// Node.js Express示例
const express = require('express');
const app = express();

app.get('/config', (req, res) => {
  // 验证API密钥
  const apiKey = req.query.key;
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // 返回配置
  res.json({
    name: "my-provider",
    description: "My LLM Provider Service",
    payload: {
      providers: [
        {
          name: "claude-code",
          hash: generateConfigHash(apiKey),
          setting: {
            env: {
              ANTHROPIC_AUTH_TOKEN: apiKey,
              ANTHROPIC_BASE_URL: "https://api.example.com"
            }
          }
        }
      ],
      functions: ["balance", "usage"]
    }
  });
});

app.listen(443, () => {
  console.log('Provider service running on port 443');
});
```

### 第四步：测试配置

用户使用以下命令订阅您的服务：

```bash
# 基本订阅
ff sub https://your-provider.com/config -a my-provider

# 订阅并自动应用
ff sub https://your-provider.com/config -a my-provider --auto

# 带参数的订阅
ff sub 'https://your-provider.com/config?key=USER_API_KEY' -a my-provider --auto
```

## 成为内置提供商

如果您的服务足够流行，可以考虑成为Flyfree的内置提供商。

### 内置提供商优势
- 用户配置更简单：`ff sub 'ff://your-provider?key=API_KEY'`
- 无需用户管理复杂URL
- 更好的用户体验

### 实现步骤

1. **创建提供商模块**
```typescript
// src/core/providers/your-provider.ts
import { BuiltinProviderParams, SubscribeResponse } from '../types';

export function handleYourProvider(params: BuiltinProviderParams): SubscribeResponse {
  const apiKey = params.params.get("key");

  if (!apiKey) {
    throw new Error("API key is required");
  }

  return {
    name: "Your Provider",
    description: "Your provider description",
    payload: {
      providers: [
        {
          name: "claude-code",
          hash: calculateObjectHash({ apiKey }),
          setting: {
            env: {
              ANTHROPIC_AUTH_TOKEN: apiKey,
              ANTHROPIC_BASE_URL: "https://api.your-provider.com"
            }
          }
        }
      ],
      functions: ["balance", "usage"]
    }
  };
}
```

2. **注册提供商**
```typescript
// src/core/builtin-providers.ts
import { handleYourProvider } from './providers/your-provider';

builtinProviders.register({
  id: "your-provider",
  name: "Your Provider",
  description: "Your provider description",
  requiresApiKey: true,
  apiKeyParam: "key",
  handler: handleYourProvider
});
```

3. **提交Pull Request到GitHub**

成为内置提供商需要向Flyfree项目提交Pull Request：

#### 步骤说明
1. **Fork仓库**: 访问 [https://github.com/llmapis/flyfree](https://github.com/llmapis/flyfree) 并点击Fork按钮
2. **克隆仓库**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/flyfree.git
   cd flyfree
   ```
3. **创建功能分支**:
   ```bash
   git checkout -b add-provider-your-provider
   ```
4. **实现提供商代码**: 在 `src/core/providers/` 目录下创建提供商文件
5. **注册提供商**: 在 `src/core/builtin-providers.ts` 中注册您的提供商
6. **更新文档**:
   - 在 `docs/BUILTIN_PROVIDERS.md` 中添加您的提供商说明
   - 更新 README.md 中的内置提供商列表
7. **提交更改**:
   ```bash
   git add .
   git commit -m "feat: add your-provider builtin provider"
   git push origin add-provider-your-provider
   ```
8. **创建Pull Request**: 在GitHub上创建PR到 `llmapis/flyfree` 的 `main` 分支

#### PR要求
- **代码质量**: 遵循项目的TypeScript代码风格
- **测试**: 添加必要的测试用例
- **文档**: 完整的提供商使用说明
- **验证**: 确保提供商通过所有测试

#### 审查流程
- 项目维护者会审查您的代码
- 可能要求修改或补充
- 通过审查后会合并到主分支
- 新提供商将在下一个版本中发布

#### 联系方式
如果您对PR流程有疑问，可以：
- 在GitHub Issues中提问
- 查看现有PR作为参考
- 阅读项目贡献指南

## 最佳实践

### 1. 错误处理
- 返回有意义的错误信息
- 使用适当的HTTP状态码
- 记录错误日志用于调试

### 2. 性能优化
- 实现缓存机制
- 优化响应时间
- 考虑CDN加速

### 3. 安全性
- 验证所有输入参数
- 实现API密钥管理
- 使用HTTPS

### 4. 监控
- 监控端点可用性
- 跟踪使用统计
- 设置告警机制

## 配置示例

### 示例1：简单的API密钥提供商
```json
{
  "name": "simple-llm",
  "description": "Simple LLM Provider",
  "payload": {
    "providers": [
      {
        "name": "claude-code",
        "hash": "config-hash-123",
        "setting": {
          "env": {
            "ANTHROPIC_AUTH_TOKEN": "sk-user-specific-key",
            "ANTHROPIC_BASE_URL": "https://api.simple-llm.com/v1"
          }
        }
      }
    ],
    "functions": []
  }
}
```

### 示例2：多模型提供商
```json
{
  "name": "multi-model-llm",
  "description": "Multi-Model LLM Provider",
  "payload": {
    "providers": [
      {
        "name": "claude-code",
        "hash": "claude-config-456",
        "setting": {
          "env": {
            "ANTHROPIC_AUTH_TOKEN": "sk-claude-key",
            "ANTHROPIC_BASE_URL": "https://api.multi-model.com/anthropic"
          }
        }
      }
    ],
    "functions": ["balance", "usage", "models"]
  }
}
```

## 故障排除

### 常见问题

1. **订阅失败**
   - 检查URL是否可访问
   - 验证JSON格式是否正确
   - 确认HTTPS证书有效

2. **配置不生效**
   - 检查返回的配置格式
   - 验证环境变量设置
   - 确认agent路径映射

3. **权限问题**
   - 检查文件权限
   - 确认API密钥有效
   - 验证网络连接

### 调试技巧

启用Flyfree调试模式：
```bash
DEBUG=1 ff sub https://your-provider.com/config
```

这将显示详细的请求和响应信息，帮助诊断问题。

## 支持与反馈

如果您在成为提供商的过程中遇到问题：

1. **查看文档**: [Flyfree项目文档](https://github.com/llmapis/flyfree)
2. **提交Issue**: 在GitHub仓库创建问题
3. **社区讨论**: 参与项目社区讨论

## 未来规划

Flyfree计划支持：
- 更多AI代理（Cursor、Windsurf等）
- 配置加密
- 使用统计
- 计费集成
- 更丰富的内置提供商

作为提供商，您的服务将自动兼容这些未来功能。