import { confirm } from "@inquirer/prompts";
import { Storage } from "../core/storage.js";
import { Logger } from "../utils/logger.js";
import chalk from "chalk";

/**
 * Unsubscribe 命令选项
 */
export interface UnsubscribeOptions {
  /** 强制删除，不需要确认 */
  force?: boolean;
}

/**
 * Unsubscribe 命令处理器
 * @param providerName - Provider 名称
 * @param options - 命令选项
 */
export async function unsubscribeCommand(
  providerName: string,
  options: UnsubscribeOptions
): Promise<void> {
  try {
    // 读取订阅配置
    const subConfig = await Storage.readSubConfig();

    // 检查 provider 是否存在
    if (!subConfig.subscribes[providerName]) {
      Logger.error(`Provider not found: ${providerName}`);
      Logger.info("");
      Logger.info("Available providers:");
      const providers = Object.keys(subConfig.subscribes);
      if (providers.length === 0) {
        Logger.info("  (none)");
      } else {
        providers.forEach((name) => {
          Logger.info(`  - ${name}`);
        });
      }
      Logger.info("");
      Logger.info('Use "ff list" to see all subscriptions');
      process.exit(1);
    }

    const providerInfo = subConfig.subscribes[providerName];

    // 显示 provider 信息
    Logger.info("");
    Logger.info(`Provider: ${chalk.bold(providerName)}`);
    Logger.info(`URL: ${chalk.gray(providerInfo.sub_url)}`);
    Logger.info(`Agents: ${chalk.cyan(providerInfo.providers.join(", "))}`);
    Logger.info("");

    // 检查是否有 agent 正在使用此 provider
    const affectedAgents: string[] = [];
    for (const [agentName, setting] of Object.entries(subConfig.setting)) {
      if (setting.provider === providerName) {
        affectedAgents.push(agentName);
      }
    }

    if (affectedAgents.length > 0) {
      Logger.warn("The following agents are using this provider:");
      affectedAgents.forEach((agent) => {
        Logger.warn(`  - ${agent}`);
      });
      Logger.info("");
      Logger.info("Unsubscribing will remove the provider configuration,");
      Logger.info("but will NOT modify the agent configuration files.");
      Logger.info("");
    }

    // 如果不是 force 模式，需要用户确认
    if (!options.force) {
      const confirmed = await confirm({
        message: `Are you sure you want to unsubscribe from "${providerName}"?`,
        default: false,
      });

      if (!confirmed) {
        Logger.info("Unsubscribe cancelled.");
        return;
      }
    }

    // 删除 provider 配置文件
    await Storage.removeProvider(providerName);

    // 从 sub.json 中删除订阅信息
    delete subConfig.subscribes[providerName];

    // 清除受影响的 agent 设置
    for (const agentName of affectedAgents) {
      delete subConfig.setting[agentName];
    }

    // 保存更新后的配置
    await Storage.writeSubConfig(subConfig);

    Logger.success(`Successfully unsubscribed from: ${providerName}`);

    if (affectedAgents.length > 0) {
      Logger.info("");
      Logger.info("Affected agents (setting cleared):");
      affectedAgents.forEach((agent) => {
        Logger.info(`  - ${agent}`);
      });
      Logger.info("");
      Logger.info("You can switch to another provider using:");
      Logger.info("  ff switch");
    }

    // 命令结束，添加空行
    Logger.info("");
  } catch (error) {
    // 如果是用户取消（Ctrl+C），优雅退出
    if (error instanceof Error && error.name === "ExitPromptError") {
      Logger.info("");
      Logger.info("Unsubscribe cancelled.");
      Logger.info("");
      return;
    }

    Logger.error(
      `Failed to unsubscribe: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    Logger.info("");
    process.exit(1);
  }
}
