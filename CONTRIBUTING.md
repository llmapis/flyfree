# 贡献指南 | Contributing Guide

感谢你对 FlyFree 的关注！我们欢迎并鼓励社区贡献。本文档将指导你如何为项目贡献代码。

Thank you for your interest in FlyFree! We welcome and encourage community contributions. This guide will help you contribute code to the project.

## 快速开始 | Quick Start

### 添加新的 Provider

如果你想添加新的 LLM Provider 支持，只需要以下几个步骤：

#### 1. 创建 Provider 实现文件

在 [src/core/providers/](src/core/providers/) 目录下创建你的 provider 文件，例如 `myservice.ts`：

```typescript
import { CLAUDE_CODE } from "../../constants/agents.js";
import type {
  BuiltinProvider,
  BuiltinProviderParams,
  BuiltinProviderResponse,
} from "../../types/builtin.js";
import { calculateObjectHash } from "../../utils/hash.js";
import { generateClaudeCodeConfig } from "./tpl.js";

// 定义你的 API Endpoint
export const MY_SERVICE_DEFAULT_CLAUDE_ENDPOINT =
  "https://api.myservice.com/v1/anthropic";

/**
 * MyService Provider
 *
 * 支持通过 MyService 的 API 访问 Claude 模型
 *
 * @see https://myservice.com/docs
 */
export const myServiceProvider: BuiltinProvider = {
  // Provider 唯一标识符（用户使用 ff://myservice 订阅）
  id: "myservice",

  // Provider 显示名称
  name: "MyService",

  // Provider 描述
  description: "MyService AI built-in provider for Claude models",

  // 是否需要 API Key
  requiresApiKey: true,

  // API Key 参数名称（用户通过 ?key=xxx 传入）
  apiKeyParam: "key",

  // 处理函数
  handler: (params: BuiltinProviderParams): BuiltinProviderResponse => {
    // 从 URL 参数中获取 API Key
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff sub ff://myservice?key=YOUR_API_KEY"
      );
    }

    // 生成 Claude Code 配置
    const claudeCodeSetting = generateClaudeCodeConfig(
      MY_SERVICE_DEFAULT_CLAUDE_ENDPOINT,
      apiKey,
      "claude-sonnet-4-5-20250929" // 你的模型 ID
    );

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    // 返回 Provider 响应
    const response: BuiltinProviderResponse = {
      name: myServiceProvider.name,
      description: myServiceProvider.description,
      payload: {
        providers: [
          {
            name: CLAUDE_CODE,
            hash: claudeCodeHash,
            setting: claudeCodeSetting,
          },
        ],
        functions: [],
      },
    };

    return response;
  },
};
```

#### 2. 导出 Provider

在 [src/core/providers/index.ts](src/core/providers/index.ts) 中导出你的 provider：

```typescript
export { zaiProvider } from "./z.ai.js";
export { miniMaxProvider } from "./minimax.js";
export { openrouterProvider } from "./openrouter.js";
export { customProvider } from "./custom.js";
export { myServiceProvider } from "./myservice.js";  // 添加这行
```

#### 3. 注册 Provider

在 [src/core/builtin-providers.ts](src/core/builtin-providers.ts) 中注册你的 provider：

```typescript
import {
  zaiProvider,
  openrouterProvider,
  miniMaxProvider,
  customProvider,
  myServiceProvider,  // 导入你的 provider
} from "./providers/index.js";

// ... 省略其他代码 ...

// 在注册区域添加注册代码
builtinProviders.register(zaiProvider);
builtinProviders.register(miniMaxProvider);
builtinProviders.register(openrouterProvider);
builtinProviders.register(customProvider);
builtinProviders.register(myServiceProvider);  // 注册你的 provider
```

#### 4. 添加常量（可选）

如果需要添加相关常量，可以在 [src/constants/index.ts](src/constants/index.ts) 或其他相关常量文件中添加：

```typescript
// 例如添加特定的环境变量 Key
export const MY_SERVICE_ENV_KEY = "MY_SERVICE_API_KEY";
```

### 完成！

现在用户就可以使用以下命令订阅你的 provider：

```bash
ff sub ff://myservice?key=YOUR_API_KEY
```

## 进阶：支持多个 Agent

如果你的 provider 需要支持多个 agent（如 Claude Code 和 Codex），可以参考 [minimax.ts](src/core/providers/minimax.ts) 的实现：

```typescript
import { CLAUDE_CODE, CODEX } from "../../constants/agents.js";
import { FFCodexEnvKey } from "../../constants/agents.js";
import { generateClaudeCodeConfig, generateCodexConfig } from "./tpl.js";

export const myServiceProvider: BuiltinProvider = {
  // ... 其他配置 ...

  handler: (params: BuiltinProviderParams): BuiltinProviderResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error("API key is required");
    }

    // 生成 Claude Code 配置
    const claudeCodeSetting = generateClaudeCodeConfig(
      MY_SERVICE_ENDPOINT,
      apiKey,
      "your-model-id"
    );

    // 生成 Codex 配置
    const codexSetting = generateCodexConfig(
      MY_SERVICE_ENDPOINT,
      apiKey,
      "your-model-id"
    );

    const response: BuiltinProviderResponse = {
      name: myServiceProvider.name,
      description: myServiceProvider.description,
      payload: {
        providers: [
          {
            name: CLAUDE_CODE,
            hash: calculateObjectHash(claudeCodeSetting),
            setting: claudeCodeSetting,
          },
          {
            name: CODEX,
            hash: calculateObjectHash(codexSetting),
            setting: codexSetting,
            export_env: { [FFCodexEnvKey]: apiKey },
          },
        ],
        functions: [],
      },
    };

    return response;
  },
};
```

## 类型定义参考

### BuiltinProvider

```typescript
interface BuiltinProvider {
  /** Provider 标识符（如 z.ai, minimax） */
  id: string;

  /** Provider 显示名称 */
  name: string;

  /** 描述 */
  description: string;

  /** 处理函数 */
  handler: BuiltinProviderHandler;

  /** 是否需要 API Key */
  requiresApiKey?: boolean;

  /** API Key 参数名称 */
  apiKeyParam?: string;
}
```

### BuiltinProviderParams

```typescript
interface BuiltinProviderParams {
  /** URL 查询参数 */
  params: URLSearchParams;

  /** 原始 URL */
  url: string;
}
```

### BuiltinProviderResponse

```typescript
interface BuiltinProviderResponse {
  /** 供应商名称 */
  name: string;

  /** 供应商描述 */
  description: string;

  /** 配置内容 */
  payload: ProviderPayload;
}
```

## 测试你的 Provider

在提交 PR 之前，请确保：

1. **本地测试**：使用 `npm run build` 构建项目
2. **功能测试**：使用 `ff sub ff://yourprovider?key=YOUR_API_KEY` 测试订阅功能
3. **验证配置**：使用 `ff list` 查看是否正确添加配置
4. **清理测试**：使用 `ff unsub` 清理测试配置

## 提交 Pull Request

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feat/add-myservice-provider`)
3. 提交你的修改 (`git commit -m 'feat: add MyService provider support'`)
4. 推送到分支 (`git push origin feat/add-myservice-provider`)
5. 创建 Pull Request

### Commit 规范

我们使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: add OpenAI provider support
fix: resolve API key validation issue
docs: update provider contribution guide
```

## 需要帮助？

如果你在贡献过程中遇到任何问题：

- 查看现有的 provider 实现作为参考：
  - [z.ai.ts](src/core/providers/z.ai.ts) - 简单的单 agent 实现
  - [minimax.ts](src/core/providers/minimax.ts) - 多 agent 实现
- 在 [Issues](https://github.com/yourusername/flyfree/issues) 中提问
- 查看项目文档了解更多细节

感谢你的贡献！🎉
