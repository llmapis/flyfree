# 内置 Provider 开发指南

本目录包含所有内置 Provider 的实现。每个 Provider 都在独立的文件中实现。

## 目录结构

```
providers/
├── README.md          # 本文件
├── index.ts           # 导出所有 providers
├── z.ai.ts            # 智谱AI Provider
├── openrouter.ts      # OpenRouter Provider
└── your-provider.ts   # 你的新 Provider
```

## 如何添加新的 Provider

### 1. 创建 Provider 文件

在 `src/core/providers/` 目录下创建新文件，例如 `my-provider.ts`：

```typescript
import type { BuiltinProvider, BuiltinProviderParams } from '../../types/builtin.js';
import type { SubscribeResponse } from '../../types/provider.js';
import { calculateObjectHash, cleanConfigString } from '../../utils/hash.js';

/**
 * My Provider
 *
 * Provider 描述
 *
 * @see https://your-provider-website.com/
 */
export const myProvider: BuiltinProvider = {
  // Provider 唯一标识符（用于 ff://my-provider）
  id: 'my-provider',

  // Provider 显示名称
  name: 'My Provider',

  // Provider 描述
  description: 'My custom provider description',

  // 是否需要 API Key
  requiresApiKey: true,

  // API Key 参数名称
  apiKeyParam: 'key',

  // Handler 函数
  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    // 1. 获取参数
    const apiKey = params.params.get('key');

    // 2. 验证参数
    if (!apiKey) {
      throw new Error('API key is required. Usage: ff sub ff://my-provider?key=YOUR_API_KEY');
    }

    // 3. 构建配置
    const claudeCodeSetting = {
      anthropic: {
        apiKey: apiKey,
        baseURL: 'https://api.my-provider.com/v1',
      },
      modelName: 'claude-3-5-sonnet-20241022',
    };

    // 4. 计算 hash
    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    // 5. 返回响应
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

### 2. 在 index.ts 中导出

编辑 `src/core/providers/index.ts`，添加你的 provider：

```typescript
export { zaiProvider } from './z.ai.js';
export { openrouterProvider } from './openrouter.js';
export { myProvider } from './my-provider.js';  // 添加这行
```

### 3. 注册 Provider

编辑 `src/core/builtin-providers.ts`，注册你的 provider：

```typescript
import { zaiProvider, openrouterProvider, myProvider } from './providers/index.js';

// ...

builtinProviders.register(zaiProvider);
builtinProviders.register(openrouterProvider);
builtinProviders.register(myProvider);  // 添加这行
```

### 4. 构建和测试

```bash
# 构建项目
npm run build

# 测试你的 provider
ff sub 'ff://my-provider?key=YOUR_API_KEY' -a test --auto

# 查看订阅列表
ff list
```

## Provider 配置说明

### BuiltinProvider 接口

```typescript
interface BuiltinProvider {
  id: string;                          // Provider ID（必需）
  name: string;                        // 显示名称（必需）
  description: string;                 // 描述（必需）
  handler: BuiltinProviderHandler;     // 处理函数（必需）
  requiresApiKey?: boolean;            // 是否需要 API Key（可选）
  apiKeyParam?: string;                // API Key 参数名（可选）
}
```

### Handler 函数参数

```typescript
interface BuiltinProviderParams {
  params: URLSearchParams;  // URL 查询参数
  url: string;              // 完整 URL
}
```

### SubscribeResponse 格式

```typescript
interface SubscribeResponse {
  name: string;  // Provider 名称
  payload: {
    providers: Array<{
      name: string;    // Agent 名称（如 'claude-code', 'codex'）
      hash: string;    // 配置 hash
      setting: any;    // Agent 配置对象
    }>;
    functions: string[];  // 支持的功能（如 ['balance', 'usage']）
  };
}
```

## 支持的 Agent

当前支持以下 agents：

### 1. claude-code

Claude Code 配置格式：

**对象格式**（推荐用于简单配置）：
```typescript
{
  anthropic: {
    apiKey: string,
    baseURL: string,
  },
  modelName: string,
}
```

**字符串格式**（推荐用于复杂配置，如环境变量）：
```typescript
const setting = cleanConfigString(`
{
    "env": {
        "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
        "ANTHROPIC_BASE_URL": "https://api.example.com",
        "API_TIMEOUT_MS": "3000000"
    }
}
`);
```

**注意**:
- 使用模板字符串时，务必用 `cleanConfigString()` 清理前后的空白和空行
- 字符串格式的配置会被直接写入文件（原始文本），不会进行 JSON 序列化
- 对象格式的配置会被 JSON 序列化后写入文件

### 2. codex

Codex (OpenAI) 配置格式：

```typescript
{
  openai: {
    apiKey: string,
    baseURL: string,
  },
  model: string,
}
```

## URL 参数处理

### 获取参数

```typescript
handler: (params: BuiltinProviderParams) => {
  const apiKey = params.params.get('key');
  const model = params.params.get('model') || 'default-model';
  const region = params.params.get('region');

  // ...
}
```

### 使用示例

```bash
# 单个参数
ff sub 'ff://my-provider?key=YOUR_KEY'

# 多个参数
ff sub 'ff://my-provider?key=YOUR_KEY&model=gpt-4&region=us-west'
```

## 错误处理

### 必需参数缺失

```typescript
if (!apiKey) {
  throw new Error('API key is required. Usage: ff sub ff://my-provider?key=YOUR_API_KEY');
}
```

### 参数验证

```typescript
const region = params.params.get('region');
if (region && !['us', 'eu', 'asia'].includes(region)) {
  throw new Error('Invalid region. Supported regions: us, eu, asia');
}
```

## 工具函数

### cleanConfigString()

清理配置字符串，移除前后的空白字符和空行。

**用途**：
- 清理模板字符串配置
- 移除不必要的空白和换行
- 保持配置内容的格式

**示例**：
```typescript
// 不使用 cleanConfigString（不推荐）
const setting = `
{
    "env": {
        "API_KEY": "${apiKey}"
    }
}
`; // 包含前后空行

// 使用 cleanConfigString（推荐）
const setting = cleanConfigString(`
{
    "env": {
        "API_KEY": "${apiKey}"
    }
}
`); // 前后空行被移除
```

### calculateObjectHash()

计算对象或字符串的 SHA-256 哈希值。

**用途**：
- 为配置生成唯一标识
- 检测配置是否改变
- 用于配置版本管理

**示例**：
```typescript
const setting = { apiKey: "xxx", baseURL: "https://..." };
const hash = calculateObjectHash(setting);
// 输出: "abc123def456..."
```

## 最佳实践

1. **清晰的错误消息**: 提供具体的使用示例
2. **参数验证**: 验证所有必需和可选参数
3. **文档注释**: 添加详细的 JSDoc 注释
4. **计算 Hash**: 使用 `calculateObjectHash()` 计算配置 hash
5. **清理配置**: 使用 `cleanConfigString()` 清理模板字符串配置
6. **测试**: 测试各种参数组合和错误情况

## 示例 Providers

参考现有的 providers：

- [z.ai.ts](./z.ai.ts) - 完整示例，支持多个 agents
- [openrouter.ts](./openrouter.ts) - 简单示例，单个 agent

## 调试

启用调试模式：

```bash
DEBUG=1 ff sub 'ff://my-provider?key=test'
```

## 文档

添加 provider 后，记得更新文档：

1. [README.md](../../../README.md) - 主文档
2. [docs/BUILTIN_PROVIDERS.md](../../../docs/BUILTIN_PROVIDERS.md) - 内置 provider 文档
3. [docs/NEW_FEATURES.md](../../../docs/NEW_FEATURES.md) - 功能更新日志

---

**需要帮助？** 查看现有 providers 的实现或提交 Issue。
