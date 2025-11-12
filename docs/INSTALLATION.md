# Flyfree 安装指南

本文档介绍如何将 Flyfree 安装为全局可执行命令。

## 方法一：从源码安装（开发者）

适用于开发、测试或想要最新版本的用户。

### 步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/flyfree.git
   cd flyfree
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **链接为全局命令**
   ```bash
   npm link
   ```

5. **验证安装**
   ```bash
   ff --version
   ff --help
   ```

### 卸载

```bash
# 在项目目录下执行
npm unlink -g

# 或者直接卸载
npm uninstall -g flyfree
```

## 方法二：从 npm 安装（推荐）

适用于普通用户（项目发布到 npm 后）。

### 全局安装

```bash
npm install -g flyfree
```

### 验证安装

```bash
ff --version
ff --help
```

### 更新

```bash
npm update -g flyfree
```

### 卸载

```bash
npm uninstall -g flyfree
```

## 方法三：使用 npx（无需安装）

如果不想全局安装，可以使用 npx 直接运行：

```bash
npx flyfree --help
npx flyfree sub https://example.com/config
npx flyfree switch
```

## 验证安装成功

安装完成后，应该可以使用以下两个命令：

```bash
# 完整命令
flyfree --version

# 简短别名
ff --version
```

如果看到版本号输出（如 `0.1.0`），说明安装成功。

## 可执行命令

Flyfree 提供了两个可执行命令：

- `ff` - 简短别名（推荐日常使用）
- `flyfree` - 完整命令名

两者功能完全相同，可以互换使用。

## 配置文件位置

安装后，Flyfree 会在以下位置存储配置：

```
~/.ff/                      # 主配置目录
├── sub.json                # 订阅信息
├── backups/                # 配置备份
└── {provider}/             # Provider 配置
```

## 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: macOS, Linux, Windows

### 检查 Node.js 版本

```bash
node --version
```

如果版本低于 18.0.0，请先升级 Node.js：
- 使用 [nvm](https://github.com/nvm-sh/nvm)
- 或从 [nodejs.org](https://nodejs.org/) 下载最新版本

## 开发模式

如果你要开发 Flyfree，可以使用 watch 模式：

```bash
# 终端 1: 监听文件变化并自动编译
npm run dev

# 终端 2: 测试命令
ff --help
```

每次修改源代码后，TypeScript 会自动重新编译，无需手动 `npm run build`。

## 权限问题

### macOS/Linux

如果遇到权限问题，可能需要使用 `sudo`：

```bash
sudo npm link
# 或
sudo npm install -g flyfree
```

**更好的方案**：配置 npm 使用用户目录，避免使用 sudo：

```bash
# 创建 npm 全局目录
mkdir ~/.npm-global

# 配置 npm 使用新目录
npm config set prefix '~/.npm-global'

# 添加到 PATH（添加到 ~/.bashrc 或 ~/.zshrc）
export PATH=~/.npm-global/bin:$PATH

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

之后就可以不用 sudo 安装全局包了。

### Windows

在 Windows 上可能需要以管理员身份运行命令提示符或 PowerShell。

## 故障排除

### 问题 1: 命令未找到

**症状**:
```bash
ff --help
# zsh: command not found: ff
```

**解决方案**:
1. 确认已执行 `npm link` 或 `npm install -g flyfree`
2. 检查 npm 全局 bin 目录是否在 PATH 中：
   ```bash
   npm config get prefix
   echo $PATH
   ```
3. 重新加载 shell 配置：
   ```bash
   source ~/.bashrc  # 或 ~/.zshrc
   ```

### 问题 2: 权限错误

**症状**:
```
Error: EACCES: permission denied
```

**解决方案**:
- 参考上面的"权限问题"章节
- 配置 npm 使用用户目录
- 或使用 `sudo`（不推荐）

### 问题 3: 版本冲突

**症状**:
已安装但版本不对

**解决方案**:
```bash
# 卸载旧版本
npm unlink -g
# 或
npm uninstall -g flyfree

# 重新安装
npm link
# 或
npm install -g flyfree
```

### 问题 4: Node.js 版本过低

**症状**:
```
error This package requires Node.js >=18.0.0
```

**解决方案**:
升级 Node.js 到 18.0.0 或更高版本。

## 环境变量

### DEBUG 模式

启用详细日志输出：

```bash
DEBUG=1 ff sub https://example.com/config
```

### 其他配置

目前 Flyfree 不使用其他环境变量，所有配置存储在 `~/.ff/` 目录下。

## 完整示例

### 首次安装和使用

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/flyfree.git
cd flyfree

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 链接为全局命令
npm link

# 5. 验证
ff --version

# 6. 开始使用
ff sub https://example.com/config --auto
ff switch
```

## 更多信息

- [README.md](../README.md) - 项目说明
- [协议规范](protocol/README.md) - 订阅协议说明
- [开发计划](plan/development-plan.md) - 开发文档

## 获取帮助

如遇到问题：
1. 查看本安装指南
2. 查看 [README.md](../README.md)
3. 提交 Issue: https://github.com/yourusername/flyfree/issues
