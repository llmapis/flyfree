import os from "os";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { Logger } from "./logger.js";

const { pathExists, readFile, writeFile, ensureFile } = fs;

/**
 * 获取 shell 配置文件路径
 */
function getShellConfigPath(): string {
  const shell = process.env.SHELL || "";
  const homeDir = os.homedir();

  if (shell.includes("zsh")) {
    return path.join(homeDir, ".zshrc");
  } else if (shell.includes("bash")) {
    // macOS 使用 .bash_profile，Linux 使用 .bashrc
    if (process.platform === "darwin") {
      return path.join(homeDir, ".bash_profile");
    }
    return path.join(homeDir, ".bashrc");
  } else if (shell.includes("fish")) {
    return path.join(homeDir, ".config", "fish", "config.fish");
  }

  // 默认使用 .zshrc (macOS 默认)
  return path.join(homeDir, ".zshrc");
}

/**
 * 将环境变量注入到 shell 配置文件
 * @param envVars - 环境变量对象
 */
export async function injectEnvToShell(
  envVars: Record<string, string>
): Promise<void> {
  if (Object.keys(envVars).length === 0) {
    return;
  }

  const shellConfigPath = getShellConfigPath();
  Logger.debug(`Shell config path: ${shellConfigPath}`);

  try {
    // 确保文件存在
    await ensureFile(shellConfigPath);

    // 读取现有内容
    let content = "";
    if (await pathExists(shellConfigPath)) {
      content = await readFile(shellConfigPath, "utf-8");
    }

    // 检查是否已经有 flyfree 的标记
    const flyFreeMarker = "# >>> flyfree env >>>";
    const flyFreeEndMarker = "# <<< flyfree env <<<";

    let hasChanges = false;
    let newEnvContent = "";

    // 为每个环境变量生成 export 语句
    for (const [key, value] of Object.entries(envVars)) {
      const exportLine = `export ${key}="${value}"`;

      // 检查是否已经存在该环境变量的定义
      const existingPattern = new RegExp(`^export ${key}="?([^"\\n]*)"?$`, "m");
      const match = content.match(existingPattern);

      if (!match) {
        // 环境变量不存在，添加新的
        newEnvContent += `${exportLine}\n`;
        hasChanges = true;
        Logger.info(`Adding environment variable: ${key}`);
      } else {
        const existingValue = match[1];
        if (existingValue !== value) {
          // 环境变量存在但值不同，需要更新
          content = content.replace(existingPattern, exportLine);
          hasChanges = true;
          Logger.info(`Updating environment variable: ${key} (value changed)`);
        } else {
          Logger.debug(`Environment variable already exists with same value: ${key}`);
        }
      }
    }

    if (hasChanges) {
      // 如果有新的环境变量需要添加
      if (content.includes(flyFreeMarker)) {
        // 已经有 flyfree 区块，在该区块内添加
        const markerIndex = content.indexOf(flyFreeMarker);
        const endMarkerIndex = content.indexOf(flyFreeEndMarker);

        if (endMarkerIndex > markerIndex) {
          // 在结束标记前插入新的环境变量
          content =
            content.substring(0, endMarkerIndex) +
            newEnvContent +
            content.substring(endMarkerIndex);
        }
      } else {
        // 没有 flyfree 区块，创建一个新的
        const flyFreeBlock = `\n${flyFreeMarker}\n${newEnvContent}${flyFreeEndMarker}\n`;
        content += flyFreeBlock;
      }

      // 写回文件
      await writeFile(shellConfigPath, content, "utf-8");
      Logger.success(`Environment variables injected to ${shellConfigPath}`);

      // 将环境变量设置到当前进程，这样本次运行就能生效
      for (const [key, value] of Object.entries(envVars)) {
        if (!process.env[key]) {
          process.env[key] = value;
          Logger.debug(`Set current process env: ${key}=${value}`);
        }
      }

      // 直接展示需要执行的命令 - 使用醒目的格式和颜色
      console.log("");
      console.log(chalk.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
      console.log(chalk.yellow.bold("⚠️  IMPORTANT: Environment variables have been configured"));
      console.log(chalk.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
      console.log("");
      console.log(chalk.yellow("To apply changes in your current terminal, run this command:"));
      console.log("");
      console.log(chalk.green.bold(`    source ${shellConfigPath}`));
      console.log("");
      console.log(chalk.gray("Or simply restart your terminal."));
      console.log(chalk.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
      console.log("");
    }
  } catch (error) {
    Logger.error(
      `Failed to inject environment variables: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * 从 shell 配置文件中移除指定的环境变量
 * @param envKeys - 要移除的环境变量名称列表
 */
export async function removeEnvFromShell(envKeys: string[]): Promise<void> {
  if (envKeys.length === 0) {
    return;
  }

  const shellConfigPath = getShellConfigPath();

  try {
    if (!(await pathExists(shellConfigPath))) {
      return;
    }

    let content = await readFile(shellConfigPath, "utf-8");
    let hasChanges = false;

    for (const key of envKeys) {
      const pattern = new RegExp(`^export ${key}=.*$`, "gm");
      const newContent = content.replace(pattern, "");

      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        Logger.info(`Removed environment variable: ${key}`);
      }
    }

    if (hasChanges) {
      await writeFile(shellConfigPath, content, "utf-8");
      Logger.success(`Environment variables removed from ${shellConfigPath}`);
    }
  } catch (error) {
    Logger.error(
      `Failed to remove environment variables: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * 设置当前进程的环境变量
 * @param envVars - 环境变量 Map
 */
export function setProcessEnv(envVars: Map<string, string>): void {
  for (const [key, value] of envVars) {
    process.env[key] = value;
    Logger.debug(`Set process env: ${key}=${value}`);
  }
}
