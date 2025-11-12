import { confirm } from '@inquirer/prompts';
import { Storage } from '../core/storage.js';
import { Applier } from '../core/applier.js';
import { Logger } from '../utils/logger.js';

/**
 * Set command - quickly switch agent provider configuration
 */
export async function setCommand(agentName: string, providerName: string): Promise<void> {
  try {
    // 读取订阅配置
    const subConfig = await Storage.readSubConfig();

    // 验证 agent 是否存在配置
    const agentConfig = subConfig.setting?.[agentName];
    if (!agentConfig) {
      Logger.error(`Agent '${agentName}' is not configured`);
      const availableAgents = Object.keys(subConfig.setting || {});
      if (availableAgents.length > 0) {
        Logger.info(`Available agents: ${availableAgents.join(', ')}`);
      } else {
        Logger.info('No agents are currently configured');
      }
      Logger.info('');
      return;
    }

    // 验证 provider 是否存在
    const providerConfig = subConfig.subscribes?.[providerName];
    if (!providerConfig) {
      Logger.error(`Provider '${providerName}' is not subscribed`);
      const availableProviders = Object.keys(subConfig.subscribes || {});
      if (availableProviders.length > 0) {
        Logger.info(`Available providers: ${availableProviders.join(', ')}`);
      } else {
        Logger.info('No providers are currently subscribed');
      }
      Logger.info('');
      return;
    }

    // 检查当前 provider 是否相同
    if (agentConfig.provider === providerName) {
      Logger.warn(`Agent '${agentName}' is already using provider '${providerName}'`);
      Logger.info('');
      return;
    }

    // 读取 provider 的 agent 配置
    const providerAgentConfig = await Storage.readAgentConfig(providerName, agentName);
    if (!providerAgentConfig) {
      Logger.error(`Provider '${providerName}' does not have configuration for agent '${agentName}'`);
      Logger.info('');
      return;
    }

    // 确认操作
    Logger.info('');
    Logger.info(`Current: ${agentName} -> ${agentConfig.provider}`);
    Logger.info(`Target:  ${agentName} -> ${providerName}`);
    Logger.info('');

    const confirmed = await confirm({
      message: `Switch agent '${agentName}' to provider '${providerName}'?`,
      default: true,
    });

    if (!confirmed) {
      Logger.info('Operation cancelled');
      return;
    }

    // 应用新配置
    Logger.info('');
    const success = await Applier.applyAgentConfig(agentName, providerAgentConfig.setting, true);

    if (success) {
      // 更新 sub.json 中的 setting
      subConfig.setting[agentName].provider = providerName;
      await Storage.writeSubConfig(subConfig);

      Logger.success(`Successfully switched ${agentName} to provider ${providerName}`);
      Logger.info(`Config path: ${Applier.getConfigPath(agentName)}`);
      Logger.info('');
    } else {
      Logger.error(`Failed to apply configuration for ${agentName}`);
      Logger.info('');
    }
  } catch (error) {
    Logger.error(`Set command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    Logger.info('');
    process.exit(1);
  }
}