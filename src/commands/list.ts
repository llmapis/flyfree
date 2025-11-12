import { Storage } from "../core/storage.js";
import { Logger } from "../utils/logger.js";
import chalk from "chalk";

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * 格式化状态
 */
function formatStatus(status: string): string {
  switch (status) {
    case "success":
      return chalk.green("✓ Success");
    case "failed":
      return chalk.red("✗ Failed");
    case "pending":
      return chalk.yellow("⋯ Pending");
    default:
      return status;
  }
}

/**
 * List 命令处理器
 * 列出所有已订阅的 provider
 */
export async function listCommand(): Promise<void> {
  try {
    // 读取订阅配置
    const subConfig = await Storage.readSubConfig();
    const providers = Object.keys(subConfig.subscribes);

    if (providers.length === 0) {
      Logger.info("No subscriptions found.");
      Logger.info("");
      Logger.info("To subscribe to a provider:");
      Logger.info("  ff sub <url>");
      Logger.info("");
      return;
    }

    // 显示标题
    console.log("");
    console.log(chalk.bold.cyan("📦 Subscribed Providers"));
    console.log("");

    // 遍历显示每个 provider
    for (const providerName of providers) {
      const info = subConfig.subscribes[providerName];

      console.log(chalk.bold(`Provider: ${providerName}`));
      console.log(`  URL:      ${chalk.gray(info.sub_url)}`);
      console.log(`  Status:   ${formatStatus(info.status)}`);
      console.log(
        `  Updated:  ${chalk.gray(formatTimestamp(info.updated_at))}`
      );
      console.log(`  Agents:   ${chalk.cyan(info.providers.join(", "))}`);
      console.log(`  Hash:     ${chalk.gray(info.hash.substring(0, 16))}...`);

      if (info.latest_response_message) {
        console.log(`  Error:    ${chalk.red(info.latest_response_message)}`);
      }

      console.log("");
    }

    // 显示当前应用的配置
    const settings = Object.keys(subConfig.setting);
    if (settings.length > 0) {
      console.log(chalk.bold.cyan("🎯 Active Configurations"));
      console.log("");

      for (const agentName of settings) {
        const provider = subConfig.setting[agentName].provider;
        console.log(`  ${chalk.bold(agentName)}: ${chalk.green(provider)}`);
      }
      console.log("");
    }

    // 显示统计信息
    const successCount = providers.filter(
      (name) => subConfig.subscribes[name].status === "success"
    ).length;
    const failedCount = providers.filter(
      (name) => subConfig.subscribes[name].status === "failed"
    ).length;

    console.log(chalk.bold("Summary:"));
    console.log(`  Total providers: ${chalk.bold(providers.length)}`);
    console.log(`  Success: ${chalk.green(successCount)}`);
    if (failedCount > 0) {
      console.log(`  Failed: ${chalk.red(failedCount)}`);
    }
    console.log("");
  } catch (error) {
    Logger.error(
      `Failed to list subscriptions: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    Logger.info("");
    process.exit(1);
  }
}
