# Flyfree 订阅协议规范

本文档定义了 Flyfree 订阅 URL 的响应格式规范，供 Provider 实现参考。

## 协议版本

当前版本：`v1.0`

## 概述

Flyfree 通过 HTTP GET 请求订阅 URL 来获取 Provider 的配置信息。Provider 需要返回符合本规范的 JSON 响应。

## HTTP 请求

### 请求方法

```
GET {subscription_url}
```

### 请求头

```
User-Agent: Flyfree/0.1.0
Accept: application/json
```

### 超时时间

默认 30 秒

## HTTP 响应

### 状态码

- `200 OK` - 成功响应
- `4xx` - 客户端错误
- `5xx` - 服务器错误

### 响应头

```
Content-Type: application/json; charset=utf-8
```

### 响应体结构

```typescript
{
  "meta": {                  // 响应元数据（必需）
    "request_id": string,   // 请求ID（必需）
    "code": number,         // 错误码（必需）
    "message": string       // 错误信息（必需）
  },
  "data": {                  // 响应数据（必需）
    "name": string,         // Provider 名称（必需）
    "description": string,  // Provider 描述（可选）
    "payload": {            // 配置内容（必需）
      "providers": [        // Agent 配置列表（必需，至少一个）
        {
          "name": string,   // Agent 名称（必需）
          "hash": string,   // 配置哈希值（必需）
          "setting": object // Agent 配置内容（必需）
        }
      ],
      "functions": string[] // 支持的功能列表（必需，可为空数组）
    }
  }
}
```

## 字段说明

### 顶层字段

#### `meta` (object, 必需)

响应的元数据信息，包含请求ID、错误码和错误信息。

- **`request_id`** (string, 必需) - 请求唯一标识符
  - 用于追踪和调试请求
  - 建议 UUID 格式或类似的唯一字符串

- **`code`** (number, 必需) - 错误码
  - 成功时：`200`
  - 失败时：相应的错误码，如 `400`, `401`, `403`, `404`, `500` 等

- **`message`** (string, 必需) - 错误信息
  - 成功时：空字符串
  - 失败时：具体的错误描述信息

#### `data` (object, 必需)

包含实际响应数据的对象。

### data 字段

#### `name` (string, 必需)

Provider 的名称，用于标识和显示。

- 格式：字母、数字、连字符、下划线
- 长度：1-50 个字符
- 示例：`"my-llm-provider"`, `"openai_compatible"`

#### `description` (string, 可选)

Provider 的描述信息。

#### `payload` (object, 必需)

包含实际配置内容的对象。

### payload 字段

#### `providers` (array, 必需)

Agent 配置列表，至少包含一个 agent。

每个 provider 对象包含：

- **`name`** (string, 必需) - Agent 名称

  - 支持的值：`"claude-code"`, `"codex"`, `"qwen-cli"` 等
  - 用户可以通过扩展支持更多 agent

- **`hash`** (string, 必需) - 配置内容的哈希值

  - 用于检测配置变更
  - 建议使用 SHA-256
  - 示例：`"a1b2c3d4e5f6..."`

- **`setting`** (object, 必需) - Agent 的实际配置内容
  - 格式：JSON 对象
  - 内容根据不同 Agent 而异
  - 会被直接写入 Agent 的配置文件

#### `functions` (array, 必需)

Provider 支持的扩展功能列表。

- 可选值：`"balance"`, `"usage"`
- 可以为空数组 `[]`
- 未来版本可能支持更多功能

## 完整示例

### 示例 1: 单个 Agent（成功响应）

```json
{
  "meta": {
    "request_id": "req-123456789-abcde",
    "code": 200,
    "message": ""
  },
  "data": {
    "name": "my-provider",
    "description": "My LLM Provider",
    "payload": {
      "providers": [
        {
          "name": "claude-code",
          "hash": "abc123def456...",
          "setting": {
            "apiKey": "your-api-key",
            "baseURL": "https://api.example.com",
            "model": "claude-3-5-sonnet-20241022",
            "maxTokens": 4096
          }
        }
      ],
      "functions": ["balance", "usage"]
    }
  }
}
```

### 示例 2: 多个 Agents（成功响应）

```json
{
  "meta": {
    "request_id": "req-987654321-fghij",
    "code": 200,
    "message": ""
  },
  "data": {
    "name": "multi-agent-provider",
    "description": "Multi-agent LLM Provider",
    "payload": {
      "providers": [
        {
          "name": "claude-code",
          "hash": "hash1",
          "setting": {
            "apiKey": "claude-key",
            "baseURL": "https://api.anthropic.com"
          }
        },
        {
          "name": "codex",
          "hash": "hash2",
          "setting": {
            "apiKey": "openai-key",
            "model": "gpt-4"
          }
        }
      ],
      "functions": ["balance"]
    }
  }
}
```

### 示例 3: 最小配置（成功响应）

```json
{
  "meta": {
    "request_id": "req-minimal-001",
    "code": 200,
    "message": ""
  },
  "data": {
    "name": "minimal-provider",
    "description": "",
    "payload": {
      "providers": [
        {
          "name": "claude-code",
          "hash": "simple-hash",
          "setting": {
            "apiKey": "sk-xxx"
          }
        }
      ],
      "functions": []
    }
  }
}
```

### 示例 4: 错误响应

```json
{
  "meta": {
    "request_id": "req-error-401",
    "code": 401,
    "message": "API key is invalid or expired"
  },
  "data": {
    "name": "",
    "description": "",
    "payload": {
      "providers": [],
      "functions": []
    }
  }
}
```

### 示例 5: 订阅令牌无效错误

```json
{
  "meta": {
    "request_id": "req-error-403",
    "code": 403,
    "message": "The subscription token is invalid or has expired"
  },
  "data": {
    "name": "",
    "description": "",
    "payload": {
      "providers": [],
      "functions": []
    }
  }
}
```

## Agent 配置格式

不同的 Agent 有不同的配置格式要求。以下是常见 Agent 的配置示例：

### Claude Code

```json
{
  "setting": {
    "anthropic": {
      "apiKey": "sk-ant-xxx",
      "baseURL": "https://api.anthropic.com"
    },
    "modelName": "claude-3-5-sonnet-20241022"
  }
}
```

### Codex (示例)

```json
{
  "setting": {
    "openai": {
      "apiKey": "sk-xxx",
      "organization": "org-xxx"
    },
    "model": "gpt-4"
  }
}
```

**注意**: 实际的 Agent 配置格式请参考各 Agent 的官方文档。

## 错误响应

当发生错误时，Provider 应该返回以下格式：

```json
{
  "meta": {
    "request_id": "请求ID",
    "code": 400,
    "message": "错误描述信息"
  },
  "data": {
    "name": "",
    "description": "",
    "payload": {
      "providers": [],
      "functions": []
    }
  }
}
```

常见错误码：

- **400** - Bad Request：请求参数错误
- **401** - Unauthorized：API Key 无效或缺失
- **403** - Forbidden：权限不足或订阅令牌无效
- **404** - Not Found：订阅 URL 不存在
- **429** - Too Many Requests：请求过于频繁
- **500** - Internal Server Error：服务器内部错误
- **503** - Service Unavailable：服务暂时不可用

注意：即使发生错误，也要返回完整的 JSON 结构，`data` 部分可以返回空值或默认值。

## 安全建议

### 1. 使用 HTTPS

订阅 URL 应该使用 HTTPS 协议，确保传输安全。

### 2. 访问控制

建议实现以下机制之一：

- URL 中包含访问令牌：`https://api.example.com/config?token=xxx`
- 使用 HTTP Basic Auth
- 使用 Bearer Token

### 3. API Key 保护

- 不要在响应中返回完整的 API Key
- 考虑使用代理模式，让 Provider 代理 API 请求
- 或者使用加密的 API Key

### 4. 速率限制

建议对订阅请求实施速率限制，防止滥用。

## 验证工具

Flyfree 使用 JSON Schema 验证响应格式。完整的 schema 定义：

```typescript
{
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: {
        request_id: { type: 'string', minLength: 1 },
        code: { type: 'number' },
        message: { type: 'string' }
      },
      required: ['request_id', 'code', 'message'],
      additionalProperties: false
    },
    data: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        payload: {
          type: 'object',
          properties: {
            providers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  hash: { type: 'string', minLength: 1 },
                  setting: { type: 'object' }
                },
                required: ['name', 'hash', 'setting']
              },
              minItems: 1
            },
            functions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['balance', 'usage']
              }
            }
          },
          required: ['providers', 'functions']
        }
      },
      required: ['name', 'payload']
    }
  },
  required: ['meta', 'data']
}
```

## 实现检查清单

Provider 实现时请确认：

- [ ] 响应状态码为 200（成功）或相应的错误状态码
- [ ] Content-Type 为 application/json
- [ ] 包含必需字段：meta, data
- [ ] meta 包含 request_id、code 和 message 字段
- [ ] data 包含 name, description, payload 字段
- [ ] data.payload.providers 至少包含一个 agent
- [ ] 每个 agent 包含 name, hash, setting
- [ ] functions 字段存在（可以为空数组）
- [ ] 所有字符串字段符合格式要求
- [ ] setting 是有效的 JSON 对象
- [ ] 错误时也要返回完整的 JSON 结构
- [ ] 使用 HTTPS
- [ ] 实现访问控制
- [ ] 响应时间 < 5 秒

## 版本兼容性

### 当前版本 (v1.1)

- 支持 `balance` 和 `usage` functions
- 基础的订阅和配置应用
- 新增错误处理机制（meta 字段包含错误码和错误信息）

### 历史版本

#### v1.0 (2025-11-12)
- 初始版本，支持基本的订阅协议

### 未来版本计划

- v1.2: 支持配置加密
- v1.3: 支持增量更新
- v2.0: 支持更多 functions

## 联系方式

如有疑问或建议，请：

- 提交 Issue: https://github.com/llmapis/flyfree/issues
- 参与讨论: https://github.com/llmapis/flyfree/discussions

## 更新日志

- 2025-11-13: v1.1 新增错误处理机制，响应格式改为 meta + data 结构
- 2025-11-12: v1.0 初始版本
