import { confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import { AGENT_CONFIG_PATHS } from '../constants/index.js';

const { pathExists, readJson, readFile } = fs;
import { Storage } from './storage.js';
import { Logger } from '../utils/logger.js';
import { resolvePath } from '../utils/path.js';

/**
 * 配置应用器
 * 负责将配置应用到实际的 agent 配置文件
 */
export class Applier {
  /**
   * 应用 agent 配置到实际配置文件
   * @param agentName - Agent 名称
   * @param setting - 配置内容
   * @param auto - 是否自动应用（跳过确认）
   * @returns 是否成功应用
   */
  static async applyAgentConfig(
    agentName: string,
    setting: unknown,
    auto: boolean = false
  ): Promise<boolean> {
    try {
      // 检查是否有配置路径映射
      const configPath = AGENT_CONFIG_PATHS[agentName];
      if (!configPath) {
        Logger.warn(
          `No config path mapping found for agent: ${agentName}`
        );
        Logger.info(
          `You can manually add the path mapping in constants/index.ts`
        );
        return false;
      }

      const resolvedPath = resolvePath(configPath);
      Logger.debug(`Resolved config path: ${resolvedPath}`);

      // 检查配置文件是否存在
      const configExists = await pathExists(resolvedPath);
      if (!configExists) {
        Logger.warn(`Config file does not exist: ${resolvedPath}`);
        Logger.info(`The configuration will be created when you apply it.`);
      }

      // 如果不是 auto 模式，需要用户确认
      if (!auto) {
        const confirmed = await confirm({
          message: `Apply configuration to ${agentName}?\nPath: ${resolvedPath}`,
          default: true,
        });

        if (!confirmed) {
          Logger.info('Configuration application cancelled.');
          return false;
        }
      }

      // 如果配置文件存在，先备份
      if (configExists) {
        const backupPath = await Storage.backup(resolvedPath, agentName);
        if (backupPath) {
          Logger.success(`Backup created: ${backupPath}`);
        }
      }

      // 写入新配置
      if (typeof setting === "string") {
        await Storage.writeRawText(resolvedPath, setting);
      } else {
        await Storage.writeJSON(resolvedPath, setting);
      }
      Logger.success(`Configuration applied to ${agentName}`);
      Logger.info(`Config path: ${resolvedPath}`);

      return true;
    } catch (error) {
      Logger.error(
        `Failed to apply configuration: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * 批量应用多个 agent 的配置
   * @param agents - Agent 配置列表 { agentName: setting }
   * @param auto - 是否自动应用
   * @returns 成功应用的 agent 列表
   */
  static async applyMultipleConfigs(
    agents: Record<string, unknown>,
    auto: boolean = false
  ): Promise<string[]> {
    const applied: string[] = [];

    for (const [agentName, setting] of Object.entries(agents)) {
      const success = await this.applyAgentConfig(agentName, setting, auto);
      if (success) {
        applied.push(agentName);
      }
    }

    return applied;
  }

  /**
   * 检查 agent 是否有配置路径映射
   */
  static hasConfigPath(agentName: string): boolean {
    return agentName in AGENT_CONFIG_PATHS;
  }

  /**
   * 获取 agent 的配置路径
   */
  static getConfigPath(agentName: string): string | undefined {
    return AGENT_CONFIG_PATHS[agentName];
  }

  /**
   * 获取所有已配置路径的 agent 列表
   */
  static getConfiguredAgents(): string[] {
    return Object.keys(AGENT_CONFIG_PATHS);
  }

  /**
   * 清除 agent 配置文件内容
   * @param agentName - Agent 名称
   */
  static async clearConfig(agentName: string): Promise<void> {
    const configPath = AGENT_CONFIG_PATHS[agentName];
    if (!configPath) {
      throw new Error(`No config path mapping found for agent: ${agentName}`);
    }

    const resolvedPath = resolvePath(configPath);
    
    // 写入空对象或空字符串，取决于原始配置类型
    const currentConfig = await this.readCurrentConfig(agentName);
    if (currentConfig !== null) {
      if (typeof currentConfig === 'string') {
        await Storage.writeRawText(resolvedPath, '');
      } else {
        await Storage.writeJSON(resolvedPath, {});
      }
    }
  }

  /**
   * 读取 agent 的当前配置
   * @param agentName - Agent 名称
   * @returns 当前配置内容
   */
  static async readCurrentConfig(agentName: string): Promise<unknown | null> {
    const configPath = AGENT_CONFIG_PATHS[agentName];
    if (!configPath) {
      return null;
    }

    const resolvedPath = resolvePath(configPath);
    
    try {
      if (await pathExists(resolvedPath)) {
        // 尝试先读取为 JSON
        try {
          return await readJson(resolvedPath);
        } catch {
          // 如果不是 JSON，读取为原始文本
          return await readFile(resolvedPath, 'utf-8');
        }
      }
    } catch (error) {
      Logger.warn(`Failed to read config for ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return null;
  }
}
