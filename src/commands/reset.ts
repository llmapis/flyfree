import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Storage } from '../core/storage.js';
import { Applier } from '../core/applier.js';
import { Logger } from '../utils/logger.js';

interface ResetOptions {
  force?: boolean;
}

/**
 * Reset agent configurations
 */
export async function resetCommand(agentName?: string, options?: ResetOptions): Promise<void> {
  try {
    const subConfig = await Storage.readSubConfig();

    if (!subConfig.setting || Object.keys(subConfig.setting).length === 0) {
      Logger.warn('No agents configured to reset');
      Logger.info('');
      return;
    }

    let agentsToReset: string[] = [];

    if (agentName) {
      // 指定了特定的 agent
      if (!subConfig.setting[agentName]) {
        Logger.error(`Agent '${agentName}' not found in configuration`);
        Logger.info(`Available agents: ${Object.keys(subConfig.setting).join(', ')}`);
        Logger.info('');
        return;
      }
      agentsToReset = [agentName];
    } else {
      // 交互式选择
      const choices = Object.keys(subConfig.setting).map((agent) => ({
        name: `${agent} (${subConfig.setting[agent].provider})`,
        value: agent,
      }));

      agentsToReset = await checkbox({
        message: 'Select agents to reset:',
        choices,
        required: true,
      });

      if (agentsToReset.length === 0) {
        Logger.warn('No agents selected');
        Logger.info('');
        return;
      }
    }

    // 确认操作
    const agentList = agentsToReset.join(', ');
    if (!options?.force) {
      const confirmed = await confirm({
        message: `Are you sure you want to reset configurations for: ${agentList}?`,
        default: false,
      });

      if (!confirmed) {
        Logger.info('Operation cancelled');
        Logger.info('');
        return;
      }
    }

    // 重置配置
    Logger.info('');
    const resetResults: string[] = [];
    const failedAgents: string[] = [];

    for (const agent of agentsToReset) {
      try {
        const configPath = Applier.getConfigPath(agent);
        
        if (configPath) {
          // 创建备份
          const backupDir = path.join(Storage.getBackupsDir(), agent);
          await fs.mkdir(backupDir, { recursive: true });
          
          const timestamp = Date.now();
          const backupPath = path.join(backupDir, `${timestamp}.json`);
          
          // 备份当前配置
          const currentConfig = await Applier.readCurrentConfig(agent);
          if (currentConfig) {
            await fs.writeFile(backupPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
            Logger.info(`✔ Backup created: ${backupPath}`);
          }

          // 清除配置文件内容
          await Applier.clearConfig(agent);
          resetResults.push(agent);
        } else {
          failedAgents.push(`${agent} (no config path)`);
        }
      } catch (error) {
        failedAgents.push(`${agent} (${error instanceof Error ? error.message : 'Unknown error'})`);
      }
    }

    // 更新配置文件
    for (const agent of resetResults) {
      delete subConfig.setting[agent];
    }
    
    await Storage.writeSubConfig(subConfig);

    // 显示结果
    Logger.info('');
    if (resetResults.length > 0) {
      Logger.success(`Reset configurations for: ${resetResults.join(', ')}`);
    }
    
    if (failedAgents.length > 0) {
      Logger.warn(`Failed to reset: ${failedAgents.join(', ')}`);
    }

    Logger.info('');
    Logger.success('Reset operation completed');
    Logger.info('');
  } catch (error) {
    Logger.error(`Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    Logger.info('');
    process.exit(1);
  }
}