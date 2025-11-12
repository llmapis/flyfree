# 内置 Provider 系统

## 概述

Flyfree 支持通过 `ff://` 协议使用内置 Provider。内置 Provider 不需要外部 API 端点，配置由系统内部生成。

## 使用方法

### 基本语法

```bash
ff sub 'ff://<provider-id>?<params>' [options]
```

- `<provider-id>`: Provider 标识符（如 `z.ai`, `openrouter`）
- `<params>`: URL 查询参数（通常包含 API Key）
- `[options]`: 标准订阅选项（`-a`, `--auto`）

**注意**: URL 必须用引号包裹，避免 shell 解析 `?` 等特殊字符。

### 示例

```bash
# 订阅智谱AI
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto

# 订阅 OpenRouter
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```

## 内置 Provider 列表

### 1. z.ai（智谱AI）

**Provider ID**: `z.ai`

**描述**: 智谱AI API 提供商，支持通过 Claude Code 和 Codex 访问。

**必需参数**:
- `key`: 智谱AI API Key

**支持的 Agent**:
- **claude-code**: 使用智谱AI的 Anthropic 兼容端点
  - Model: `claude-3-5-sonnet-20241022`
  - Base URL: `https://open.bigmodel.cn/api/paas/v4/anthropic`
- **codex**: 使用智谱AI的 OpenAI 兼容端点
  - Model: `gpt-4`
  - Base URL: `https://open.bigmodel.cn/api/paas/v4`

**使用示例**:
```bash
# 订阅并自动应用
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto

# 订阅但不自动应用
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu

# 切换到 claude-code
ff switch  # 然后选择 zhipu -> claude-code
```

**API Key 获取**:
访问 [智谱AI开放平台](https://open.bigmodel.cn/) 注册并获取 API Key。

---

### 2. openrouter

**Provider ID**: `openrouter`

**描述**: OpenRouter API 提供商，支持多种 LLM 模型。

**必需参数**:
- `key`: OpenRouter API Key

**支持的 Agent**:
- **claude-code**: Anthropic Claude 3.5 Sonnet
  - Model: `anthropic/claude-3.5-sonnet`
  - Base URL: `https://openrouter.ai/api/v1`

**使用示例**:
```bash
# 订阅并自动应用
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto

# 订阅但不自动应用
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter
```

**API Key 获取**:
访问 [OpenRouter](https://openrouter.ai/) 注册并获取 API Key。

---

## 错误处理

### 缺少 API Key

```bash
$ ff sub 'ff://z.ai' -a test
✖ Subscription failed: API key is required. Usage: ff sub ff://z.ai?key=YOUR_API_KEY
```

### 未知 Provider

```bash
$ ff sub 'ff://unknown?key=test'
✖ Subscription failed: Unknown built-in provider: unknown
Available providers: z.ai, openrouter
```

## 开发指南

### 添加新的内置 Provider

每个内置 Provider 都在独立的文件中实现，便于维护和扩展。

#### 步骤 1: 创建 Provider 文件

在 `src/core/providers/` 目录下创建新文件，例如 `my-provider.ts`：

```typescript
import type { BuiltinProvider, BuiltinProviderParams } from '../../types/builtin.js';
import type { SubscribeResponse } from '../../types/provider.js';
import { calculateObjectHash } from '../../utils/hash.js';

/**
 * My Provider
 *
 * Provider 描述
 *
 * @see https://your-provider-website.com/
 */
export const myProvider: BuiltinProvider = {
  id: 'my-provider',
  name: 'My Provider',
  description: 'My custom provider',
  requiresApiKey: true,
  apiKeyParam: 'key',

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get('key');

    if (!apiKey) {
      throw new Error('API key is required. Usage: ff sub ff://my-provider?key=YOUR_API_KEY');
    }

    const claudeCodeSetting = {
      anthropic: {
        apiKey: apiKey,
        baseURL: 'https://api.my-provider.com/v1',
      },
      modelName: 'claude-3-5-sonnet-20241022',
    };

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    return {
      name: 'My Provider',
      payload: {
        providers: [
          {
            name: 'claude-code',
            hash: claudeCodeHash,
            setting: claudeCodeSetting,
          },
        ],
        functions: [],
      },
    };
  },
};
```

#### 步骤 2: 导出 Provider

编辑 `src/core/providers/index.ts`：

```typescript
export { zaiProvider } from './z.ai.js';
export { openrouterProvider } from './openrouter.js';
export { myProvider } from './my-provider.js';  // 添加这行
```

#### 步骤 3: 注册 Provider

编辑 `src/core/builtin-providers.ts`：

```typescript
import { zaiProvider, openrouterProvider, myProvider } from './providers/index.js';

// ...

builtinProviders.register(zaiProvider);
builtinProviders.register(openrouterProvider);
builtinProviders.register(myProvider);  // 添加这行
```

详细开发指南请参考：[src/core/providers/README.md](../src/core/providers/README.md)

### 类型定义

#### BuiltinProvider

```typescript
interface BuiltinProvider {
  id: string;                          // Provider ID
  name: string;                        // 显示名称
  description: string;                 // 描述
  handler: BuiltinProviderHandler;     // 处理函数
  requiresApiKey?: boolean;            // 是否需要 API Key
  apiKeyParam?: string;                // API Key 参数名
}
```

#### BuiltinProviderParams

```typescript
interface BuiltinProviderParams {
  params: URLSearchParams;  // URL 查询参数
  url: string;              // 完整 URL
}
```

#### BuiltinProviderHandler

```typescript
type BuiltinProviderHandler = (
  params: BuiltinProviderParams
) => SubscribeResponse | Promise<SubscribeResponse>;
```

## 技术实现

### 架构

```
┌─────────────────────────────────────────┐
│         订阅命令 (ff sub)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Subscriber.subscribe()              │
│  ┌───────────────────────────────────┐  │
│  │ 1. 检查是否是 ff:// 协议          │  │
│  │ 2. 是：调用 handleBuiltinProvider │  │
│  │ 3. 否：HTTP 请求外部配置          │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Built-in     │    │ HTTP Fetch   │
│ Provider     │    │ External     │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 │
                 ▼
      ┌──────────────────┐
      │ SubscribeResponse│
      └──────────────────┘
                 │
                 ▼
      ┌──────────────────┐
      │ 保存配置          │
      │ 应用设置          │
      └──────────────────┘
```

### 关键文件

1. **src/types/builtin.ts**: 类型定义
2. **src/core/builtin-providers.ts**: Provider 注册中心
3. **src/core/providers/**: 各个 Provider 的实现
   - **z.ai.ts**: 智谱AI Provider
   - **openrouter.ts**: OpenRouter Provider
   - **index.ts**: 统一导出
   - **README.md**: 开发指南
4. **src/core/subscriber.ts**: 订阅流程集成

## 优势

1. **无需外部端点**: 不需要部署额外的配置服务器
2. **离线使用**: 配置生成完全在本地完成
3. **快速订阅**: 无网络延迟
4. **易于扩展**: 简单的注册机制
5. **类型安全**: 完整的 TypeScript 类型支持

## 最佳实践

1. **API Key 安全**:
   - 不要在命令历史中暴露 API Key
   - 考虑使用环境变量
   - 定期轮换 API Key

2. **Provider ID 命名**:
   - 使用小写字母和连字符
   - 避免特殊字符
   - 保持简短易记

3. **错误处理**:
   - 提供清晰的错误消息
   - 包含使用示例
   - 验证所有必需参数

4. **文档**:
   - 记录所有参数
   - 提供完整的使用示例
   - 说明获取 API Key 的方法

## 常见问题

### Q: 如何列出所有可用的内置 Provider？

A: 尝试使用不存在的 Provider，错误消息会列出所有可用的：

```bash
$ ff sub 'ff://list'
Available providers: z.ai, openrouter
```

### Q: 内置 Provider 和外部 Provider 有什么区别？

A:
- **内置 Provider**: 使用 `ff://` 协议，配置在本地生成，无需网络请求
- **外部 Provider**: 使用 `https://` 协议，配置从远程服务器获取

### Q: 可以为内置 Provider 添加自定义参数吗？

A: 可以！在 handler 函数中通过 `params.params.get('param-name')` 获取任何 URL 参数。

### Q: 内置 Provider 支持哪些 Agent？

A: 当前支持 `claude-code` 和 `codex`。可以通过扩展 `AGENT_CONFIG_PATHS` 添加更多 Agent。

## 更新日志

### v0.2.0 (2025-11-12)

**新功能**:
- ✅ 添加 `ff://` 协议支持
- ✅ 实现 Provider 注册系统
- ✅ 添加 z.ai 内置 Provider
- ✅ 添加 openrouter 内置 Provider
- ✅ URL 参数解析
- ✅ 错误处理和验证

---

**文档创建时间**: 2025-11-12
**版本**: v0.2.0
