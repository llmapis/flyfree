# Flyfree 项目专题

> **自由翱翔** - 轻松管理 LLM Provider 配置的 CLI 工具

## 🎯 项目概述

Flyfree 是一个专为 AI 编程工具设计的配置管理系统，让开发者能够快速切换不同的 LLM Provider，如 OpenAI、Claude、智谱AI 等。通过统一的接口，您可以在不同的 AI 编程助手（如 Claude Code、Codex）之间无缝切换后端服务。

### 🔗 项目链接
- **GitHub**: [github.com/wangboyan/flyfree](https://github.com/wangboyan/flyfree)
- **NPM**: [npmjs.com/package/flyfree](https://npmjs.com/package/flyfree)
- **作者**: [wangboyan](https://github.com/wangboyan)

## ✨ 核心特性

### 🔄 一键切换 Provider
```bash
# 智谱AI -> OpenRouter -> 自定义 Provider
ff set claude-code zhipu
ff set claude-code openrouter
ff set claude-code custom-provider
```

### 📦 内置 Provider 支持
支持 `ff://` 协议，无需外部配置服务器：
- **智谱AI**: `ff://z.ai?key=YOUR_KEY`
- **OpenRouter**: `ff://openrouter?key=YOUR_KEY`

### 🛡️ 安全备份机制
- 自动备份原始配置
- 最多保留 10 个历史版本
- 一键恢复到任意版本

### 🎨 优雅的交互体验
- 彩色 CLI 界面
- 交互式选择器
- 详细的状态反馈

## 🚀 快速开始

### 安装

```bash
# 全局安装
npm install -g flyfree

# 或使用 npx 直接运行
npx flyfree --help
```

### 基本使用

```bash
# 1. 订阅智谱AI
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto

# 2. 查看所有订阅
ff list

# 3. 交互式切换
ff switch

# 4. 快速切换
ff set claude-code zhipu
```

## 🏆 使用案例

### 案例 1: 多 Provider 开发环境

**场景**: 开发者需要在不同的 LLM Provider 之间切换，以对比性能和成本。

```bash
# 订阅多个 Provider
ff sub 'ff://z.ai?key=ZHI_KEY' -a zhipu --auto
ff sub 'ff://openrouter?key=OR_KEY' -a openrouter --auto
ff sub https://custom-api.com/config -a custom --auto

# 快速切换进行测试
ff set claude-code zhipu     # 测试智谱AI
ff set claude-code openrouter # 测试 OpenRouter
ff set claude-code custom     # 测试自定义服务
```

### 案例 2: 团队配置标准化

**场景**: 团队希望标准化 LLM 配置，确保所有成员使用相同的 Provider 设置。

```bash
# 团队管理员创建配置端点
# https://team-config.example.com/llm-config

# 团队成员统一订阅
ff sub https://team-config.example.com/llm-config -a team-standard --auto

# 自动同步最新配置
ff switch  # 选择 team-standard
```

### 案例 3: 成本优化策略

**场景**: 根据任务类型选择不同成本的 Provider。

```bash
# 轻量任务使用免费/便宜的服务
ff sub 'ff://z.ai?key=KEY' -a budget

# 重要任务使用高质量服务  
ff sub 'ff://openrouter?key=KEY' -a premium

# 根据任务切换
ff set claude-code budget   # 日常开发
ff set claude-code premium  # 生产代码审查
```

### 案例 4: 开发/测试/生产环境隔离

```bash
# 开发环境
ff sub https://dev-api.com/config -a dev --auto

# 测试环境
ff sub https://test-api.com/config -a test --auto

# 生产环境
ff sub https://prod-api.com/config -a prod --auto

# 环境切换
ff set claude-code dev   # 开发模式
ff set claude-code prod  # 生产模式
```

## 🛠️ 技术实现

### 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Commands   │    │  Configuration  │    │  Agent Configs  │
│                 │    │    Management   │    │                 │
│ • subscribe     │────│                 │────│ • Claude Code   │
│ • switch        │    │ • Storage       │    │ • Codex         │
│ • list          │    │ • Validation    │    │ • Custom Agents │
│ • set/reset     │    │ • Backup        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Built-in       │──────────────┘
                        │  Providers      │
                        │                 │
                        │ • Z.AI         │
                        │ • OpenRouter    │
                        │ • Extensible    │
                        └─────────────────┘
```

### 核心技术栈

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **CLI Framework**: Commander.js
- **Validation**: Ajv (JSON Schema)
- **Storage**: File-based JSON
- **HTTP Client**: Axios
- **UI Components**: Inquirer, Ora, Chalk

### 关键特性实现

#### 1. 内置 Provider 系统

```typescript
// 支持 ff:// 协议的内置 Provider
export const zaiProvider: BuiltinProvider = {
  id: 'z.ai',
  name: 'Z.AI (智谱AI)',
  handler: (params) => {
    const apiKey = params.params.get('key');
    return {
      name: 'Z.AI',
      payload: {
        providers: [{
          name: 'claude-code',
          setting: {
            anthropic: {
              apiKey,
              baseURL: 'https://open.bigmodel.cn/api/paas/v4/anthropic'
            }
          }
        }]
      }
    };
  }
};
```

#### 2. 配置验证和备份

```typescript
// JSON Schema 验证
const schema = {
  type: 'object',
  properties: {
    providers: {
      type: 'array',
      items: { /* provider schema */ }
    }
  },
  required: ['providers']
};

// 自动备份机制
await Storage.backup(agentName, currentConfig);
await Storage.apply(agentName, newConfig);
```

#### 3. 交互式命令行界面

```typescript
// 美观的选择器
const provider = await select({
  message: 'Select a provider:',
  choices: providers.map(p => ({
    name: p.name,
    value: p,
    description: p.description
  }))
});
```

## 📊 项目数据

### 开发状态
- **版本**: v0.2.0
- **开发时间**: 2024-2025
- **代码行数**: ~2000+ lines
- **测试覆盖率**: 正在完善中

### 支持的 Agent
- ✅ **Claude Code**: Anthropic 的官方 CLI 工具
- ✅ **Codex**: OpenAI 代码生成工具  
- 🔄 **扩展中**: 更多 AI 编程工具

### 支持的 Provider
- ✅ **智谱AI**: 国产 LLM 服务商
- ✅ **OpenRouter**: 多模型聚合平台
- ✅ **自定义**: 任何兼容 OpenAI/Anthropic API 的服务
- 🔄 **计划中**: Gemini、Claude Direct、更多国产服务

## 🔮 未来规划

### v0.3.0 路线图
- [ ] **Web Dashboard**: 浏览器端配置管理界面
- [ ] **配置模板**: 预定义的最佳实践配置
- [ ] **使用统计**: Provider 使用情况分析
- [ ] **成本跟踪**: API 调用成本监控

### v0.4.0 路线图  
- [ ] **配置同步**: 云端配置同步服务
- [ ] **团队管理**: 企业级团队配置管理
- [ ] **插件系统**: 第三方扩展支持
- [ ] **配置加密**: 敏感信息加密存储

### v1.0.0 路线图
- [ ] **GUI 客户端**: 跨平台桌面应用
- [ ] **容器支持**: Docker/K8s 环境集成
- [ ] **CI/CD 集成**: GitHub Actions/GitLab CI 支持
- [ ] **监控告警**: 服务状态监控和告警

## 🤝 参与贡献

### 贡献方式

1. **代码贡献**: 提交 Pull Request
2. **问题反馈**: 创建 GitHub Issue
3. **文档改进**: 完善使用文档
4. **功能建议**: 提出新的功能需求

### 开发环境设置

```bash
# 1. 克隆项目
git clone https://github.com/wangboyan/flyfree.git
cd flyfree

# 2. 安装依赖
npm install

# 3. 开发模式
npm run dev

# 4. 构建项目
npm run build

# 5. 本地测试
node dist/index.js --help
```

### 代码规范

- **TypeScript**: 强类型编程
- **ESM**: 使用 ES Module
- **函数式**: 优先使用纯函数
- **错误处理**: 完善的错误处理机制

## 📱 社区与支持

### 获取帮助

- **文档**: [docs/](docs/) 目录下的详细文档
- **示例**: [examples/](examples/) 目录下的使用示例
- **Issues**: [GitHub Issues](https://github.com/wangboyan/flyfree/issues)

### 社区资源

- **博客文章**: 使用经验分享
- **视频教程**: 操作演示视频
- **最佳实践**: 社区积累的使用技巧

## 🏅 项目荣誉

### 设计理念

**Flyfree** 的名字来源于"自由翱翔"的理念 - 让开发者在不同的 LLM 服务之间自由切换，不被任何单一 Provider 绑定。这种设计哲学体现在：

- **Provider 无关**: 支持任何兼容的 API 服务
- **配置统一**: 一套工具管理所有 Agent
- **迁移简单**: 随时切换，无痛迁移
- **开放扩展**: 易于添加新的 Provider 和 Agent

### 技术创新

1. **内置 Provider 协议**: 创新的 `ff://` 协议简化了常用服务的订阅流程
2. **配置哈希验证**: 确保配置完整性和变更检测
3. **交互式体验**: 丰富的命令行交互，降低使用门槛
4. **渐进式架构**: 从简单的配置切换到完整的管理平台

## 📄 许可证

MIT License - 自由使用、修改和分发

---

**Flyfree** - 让 AI 编程更自由，让配置管理更简单！

*最后更新：2024-11-12*