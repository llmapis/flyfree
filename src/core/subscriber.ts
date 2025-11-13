import axios from "axios";
import ora from "ora";
import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import type { SubscribeResponse, ProviderConfig } from "../types/provider.js";
import type { SubscribeInfo } from "../types/config.js";
import { createAgentConfig } from "../types/agent.js";
import {
  validateSubscribeResponse,
  formatValidationErrors,
} from "../utils/validator.js";
import { calculateObjectHash } from "../utils/hash.js";
import { Storage } from "./storage.js";
import { Applier } from "./applier.js";
import { Logger } from "../utils/logger.js";
import { HTTP_TIMEOUT } from "../constants/index.js";
import { handleBuiltinProvider } from "./builtin-providers.js";

/**
 * 订阅管理器
 */
export class Subscriber {
  /**
   * 从 URL 获取订阅配置
   */
  static async fetchSubscription(url: string): Promise<SubscribeResponse> {
    const spinner = ora("Fetching subscription from URL...").start();

    try {
      const response = await axios.get(url, {
        timeout: HTTP_TIMEOUT,
        headers: {
          "User-Agent": "Flyfree/0.1.0",
        },
      });

      spinner.succeed("Subscription fetched successfully");

      // 验证响应数据格式
      const validation = validateSubscribeResponse(response.data);
      if (!validation.valid) {
        const errorMsg = formatValidationErrors(validation.errors || []);
        throw new Error(`Invalid subscription response format:\n${errorMsg}`);
      }

      const responseData = response.data as SubscribeResponse;

      // 检查响应中的错误信息
      if (responseData.meta.code && responseData.meta.code !== 200) {
        const errorMsg = responseData.meta.message || "Unknown error";
        throw new Error(`Provider error (${responseData.meta.code}): ${errorMsg}`);
      }

      return responseData;
    } catch (error) {
      spinner.fail("Failed to fetch subscription");

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error("Request timeout");
        }
        if (error.response) {
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText}`
          );
        }
        if (error.request) {
          throw new Error("No response received from server");
        }
      }

      throw error;
    }
  }

  /**
   * 订阅配置
   * @param url - 订阅 URL
   * @param alias - Provider 别名（可选）
   * @param auto - 是否自动应用配置
   * @param select - 选择要应用的 agents（true 为交互式，字符串为逗号分隔的名称）
   */
  static async subscribe(
    url: string,
    alias?: string,
    auto: boolean = false,
    select?: boolean | string
  ): Promise<void> {
    try {
      // 1. 获取订阅配置
      let data: SubscribeResponse;

      // 检查是否是内置 Provider（ff:// 协议）
      const builtinResponse = await handleBuiltinProvider(url);
      if (builtinResponse) {
        Logger.info("Using built-in provider");
        data = builtinResponse;
      } else {
        // 使用 HTTP 获取外部配置
        data = await this.fetchSubscription(url);
      }

      // 2. 确定 provider 名称
      const providerName = alias || data.data.name;
      Logger.info(`Provider name: ${providerName}`);

      // 3. 计算 hash
      const hash = calculateObjectHash(data);
      const timestamp = Math.floor(Date.now() / 1000);

      // 4. 保存 provider 配置
      const providerConfig: ProviderConfig = {
        name: data.data.name,
        sub_url: url,
        hash,
        updated_at: timestamp,
        payload: data.data.payload,
      };

      await Storage.writeProviderConfig(providerName, providerConfig);
      Logger.success(`Provider configuration saved: ${providerName}`);

      // 5. 保存各个 agent 的配置
      for (const agentConfig of data.data.payload.providers) {
        const agentConfigData = createAgentConfig(
          agentConfig.name,
          agentConfig.hash,
          agentConfig.setting
        );

        await Storage.writeAgentConfig(
          providerName,
          agentConfig.name,
          agentConfigData
        );
        Logger.success(`Agent configuration saved: ${agentConfig.name}`);
      }

      // 6. 更新 sub.json
      const subConfig = await Storage.readSubConfig();

      const subscribeInfo: SubscribeInfo = {
        sub_url: url,
        providers: data.data.payload.providers.map((p) => p.name),
        status: "success",
        updated_at: timestamp,
        hash,
        latest_response_message: "",
      };

      subConfig.subscribes[providerName] = subscribeInfo;
      await Storage.writeSubConfig(subConfig);
      Logger.success("Subscription information updated");

      // 7. 处理 select 参数
      if (select) {
        Logger.info("");
        const availableAgents = data.data.payload.providers.map((p) => p.name);
        let selectedAgents: string[] = [];

        if (typeof select === "string") {
          // 直接指定的 agents
          selectedAgents = select.split(",").map((s) => s.trim());

          // 验证 agents
          const invalidAgents = selectedAgents.filter(
            (a) => !availableAgents.includes(a)
          );
          if (invalidAgents.length > 0) {
            throw new Error(
              `Invalid agent(s): ${invalidAgents.join(", ")}\n` +
                `Available agents: ${availableAgents.join(", ")}`
            );
          }
        } else {
          // 交互式选择
          const choices = data.data.payload.providers.map((p) => {
            const hasPath = Applier.hasConfigPath(p.name);
            let name = p.name;
            if (!hasPath) {
              name += chalk.yellow(" (no path)");
            }
            return {
              name,
              value: p.name,
              checked: hasPath,
            };
          });

          selectedAgents = await checkbox({
            message: "Select agents to apply:",
            choices,
            required: false,
          });

          if (selectedAgents.length === 0) {
            Logger.warn("No agents selected");
            return;
          }
        }

        // 应用选中的 agents
        Logger.info("");
        const agentsToApply: Record<string, unknown> = {};
        const skippedAgents: string[] = [];

        for (const agentName of selectedAgents) {
          if (Applier.hasConfigPath(agentName)) {
            const agentConfig = data.data.payload.providers.find(
              (p) => p.name === agentName
            );
            if (agentConfig) {
              agentsToApply[agentName] = agentConfig.setting;
            }
          } else {
            skippedAgents.push(agentName);
          }
        }

        if (skippedAgents.length > 0) {
          Logger.warn(
            `Skipped agents without config path: ${skippedAgents.join(", ")}`
          );
        }

        if (Object.keys(agentsToApply).length > 0) {
          const applied = await Applier.applyMultipleConfigs(
            agentsToApply,
            true
          );

          // 更新 setting 字段
          for (const agentName of applied) {
            subConfig.setting[agentName] = { provider: providerName };
          }
          await Storage.writeSubConfig(subConfig);

          Logger.success(
            `Applied configurations to ${
              applied.length
            } agent(s): ${applied.join(", ")}`
          );
        } else {
          Logger.warn("No agents with configured paths to apply");
        }

        return;
      }

      // 8. 如果开启 auto，自动应用配置
      if (auto) {
        Logger.info("Auto-applying configurations...");

        const agentsToApply: Record<string, unknown> = {};
        for (const agentConfig of data.data.payload.providers) {
          if (Applier.hasConfigPath(agentConfig.name)) {
            agentsToApply[agentConfig.name] = agentConfig.setting;
          }
        }

        if (Object.keys(agentsToApply).length > 0) {
          const applied = await Applier.applyMultipleConfigs(
            agentsToApply,
            true
          );

          // 更新 setting 字段
          for (const agentName of applied) {
            subConfig.setting[agentName] = { provider: providerName };
          }
          await Storage.writeSubConfig(subConfig);

          Logger.success(
            `Applied configurations to ${
              applied.length
            } agent(s): ${applied.join(", ")}`
          );
        } else {
          Logger.warn("No agents with configured paths found");
        }
      }
    } catch (error) {
      // 保存错误信息到 sub.json
      try {
        const subConfig = await Storage.readSubConfig();
        const providerName = alias || "unknown";

        if (subConfig.subscribes[providerName]) {
          subConfig.subscribes[providerName].status = "failed";
          subConfig.subscribes[providerName].latest_response_message =
            error instanceof Error ? error.message : String(error);
          await Storage.writeSubConfig(subConfig);
        }
      } catch (saveError) {
        Logger.debug("Failed to save error to sub.json");
      }

      throw error;
    }
  }

  /**
   * 更新订阅（重新获取配置）
   */
  static async updateSubscription(providerName: string): Promise<void> {
    const subConfig = await Storage.readSubConfig();
    const subscribeInfo = subConfig.subscribes[providerName];

    if (!subscribeInfo) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    Logger.info(`Updating subscription for: ${providerName}`);
    await this.subscribe(subscribeInfo.sub_url, providerName, false);
  }
}
