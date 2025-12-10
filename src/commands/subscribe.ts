import { Subscriber } from "../core/subscriber.js";
import { Logger } from "../utils/logger.js";

/**
 * Subscribe 命令选项
 */
export interface SubscribeOptions {
  /** Provider 别名 */
  alias?: string;
  /** 是否自动应用配置 */
  auto?: boolean;
  /** 选择要应用的 agents（可以是 true 表示交互式选择，或者逗号分隔的 agent 名称） */
  select?: boolean | string;
}

/**
 * Subscribe 命令处理器
 * @param url - 订阅 URL
 * @param options - 命令选项
 */
export async function subscribeCommand(
  url: string,
  options: SubscribeOptions
): Promise<void> {
  try {
    Logger.info(`Subscribing to: ${url}`);

    if (options.alias) {
      Logger.info(`Using alias: ${options.alias}`);
    }

    if (options.auto) {
      Logger.info("Auto-apply mode enabled");
    }

    if (options.select) {
      if (typeof options.select === "string") {
        Logger.info(`Selecting agents: ${options.select}`);
      } else {
        Logger.info("Interactive agent selection enabled");
      }
    }

    // 执行订阅
    await Subscriber.subscribe(
      url,
      options.alias,
      options.auto,
      options.select
    );

    Logger.info("");
    Logger.success("Subscription completed successfully!");

    if (!options.auto && !options.select) {
      Logger.info("");
      Logger.info("To apply configurations, use:");
      Logger.info("  ff switch (or ff s)");
    }

    // 命令结束，添加空行
    Logger.info("");
  } catch (error) {
    Logger.error(
      `Subscription failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    Logger.info("");
    process.exit(1);
  }
}
