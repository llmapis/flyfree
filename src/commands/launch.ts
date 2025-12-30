import { spawn } from "child_process";
import { Storage } from "../core/storage.js";
import { Logger } from "../utils/logger.js";
import { CODEX, CLAUDE_CODE } from "../constants/agents.js";
import { AGENT_START_COMMAND } from "../constants/index.js";
import type { ProviderConfig } from "../types/provider.js";

/**
 * Launch command - 启动 agent 并注入环境变量
 */
export async function launchCommand(agentName: string, args: string[]) {
  try {
    // 当前支持 codex 和 claude
    if (!AGENT_START_COMMAND[agentName]) {
      Logger.error(`Unsupported agent: ${agentName}`);
      Logger.info(
        `Currently only 'codex' and 'claude' are supported for launching`
      );
      process.exit(1);
    }

    // 将 claude 映射为 claude-code 用于配置查找
    const configAgentName = agentName === "claude" ? CLAUDE_CODE : agentName;

    // 读取 sub.json 获取当前使用的 provider
    const subConfig = await Storage.readSubConfig();
    const agentSetting = subConfig.setting[configAgentName];

    if (!agentSetting) {
      Logger.error(`No configuration found for agent '${agentName}'`);
      Logger.info(`Please run 'ff switch' to configure ${agentName} first`);
      process.exit(1);
    }

    const providerName = agentSetting.provider;

    // 读取 provider 配置
    const providerConfig: ProviderConfig | null =
      await Storage.readProviderConfig(providerName);

    if (!providerConfig) {
      Logger.error(`Configuration not found for provider '${providerName}'`);
      Logger.info(`Please run 'ff switch' to reconfigure`);
      process.exit(1);
    }

    // 从 provider 配置中找到对应 agent 的 export_env
    const agentProviderConfig = providerConfig.payload.providers.find(
      (p) => p.name === configAgentName
    );

    if (!agentProviderConfig) {
      Logger.error(
        `Agent '${agentName}' not found in provider '${providerName}'`
      );
      Logger.info(`Please run 'ff switch' to reconfigure`);
      process.exit(1);
    }

    // 获取所有需要导出的环境变量
    const exportEnv = agentProviderConfig.export_env || {};

    if (Object.keys(exportEnv).length === 0) {
      Logger.warn(`No environment variables found in configuration`);
      Logger.info(
        `Launching ${agentName} without additional environment variables`
      );
    }

    Logger.info(`Launching ${agentName} with provider: ${providerName}`);

    // 设置环境变量并启动 codex
    const env = {
      ...process.env,
      ...exportEnv,
    };

    // 为 codex 添加 --profile flyfree 参数
    const finalArgs =
      agentName === CODEX ? ["--profile", "flyfree", ...args] : args;

    // 获取实际的启动命令
    const startCommand = AGENT_START_COMMAND[agentName];

    if (!startCommand) {
      Logger.error(`Start command not found for agent: ${agentName}`);
      process.exit(1);
    }

    // 启动 agent 进程，继承当前 stdio
    // Windows 需要 shell: true 来正确解析 .cmd 和 .bat 文件
    const child = spawn(startCommand, finalArgs, {
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    // 处理子进程退出
    child.on("exit", (code, signal) => {
      if (signal) {
        Logger.debug(`${agentName} was killed with signal ${signal}`);
        process.exit(1);
      } else if (code !== 0) {
        Logger.debug(`${agentName} exited with code ${code}`);
        process.exit(code ?? 1);
      } else {
        process.exit(0);
      }
    });

    // 处理子进程错误
    child.on("error", (error) => {
      Logger.error(`Failed to start ${agentName}: ${error.message}`);
      Logger.info(
        `Make sure '${agentName}' is installed and available in your PATH`
      );
      process.exit(1);
    });
  } catch (error) {
    Logger.error(
      `Failed to launch ${agentName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}
