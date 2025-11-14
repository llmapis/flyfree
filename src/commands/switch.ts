import { select, confirm } from '@inquirer/prompts';
import { Storage } from '../core/storage.js';
import { Applier } from '../core/applier.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';

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
    case 'success':
      return chalk.green('✓ Success');
    case 'failed':
      return chalk.red('✗ Failed');
    case 'pending':
      return chalk.yellow('⋯ Pending');
    default:
      return status;
  }
}

/**
 * Switch 命令处理器
 * 交互式选择和切换 provider 配置
 */
export async function switchCommand(): Promise<void> {
  try {
    // 读取订阅配置
    const subConfig = await Storage.readSubConfig();
    const providers = Object.keys(subConfig.subscribes);

    if (providers.length === 0) {
      Logger.warn('No providers found.');
      Logger.info('Please subscribe to a provider first:');
      Logger.info('  ff sub <url>');
      Logger.info('');
      return;
    }

    // 主循环：选择 provider
    while (true) {
      // 准备 provider 选择列表
      const providerChoices = providers.map((name) => {
        const info = subConfig.subscribes[name];
        const agents = info.providers.join(', ');
        const status = formatStatus(info.status);
        const time = formatTimestamp(info.updated_at);

        return {
          name: `${chalk.bold(name)} ${chalk.gray(`(${agents})`)}`,
          value: name,
          description: `${status} | Updated: ${time}`,
        };
      });

      // 添加退出选项
      providerChoices.push({
        name: chalk.gray('← Exit'),
        value: '__exit__',
        description: 'Exit the switch menu',
      });

      // 选择 provider
      const selectedProvider = await select({
        message: 'Select a provider:',
        choices: providerChoices,
      });

      if (selectedProvider === '__exit__') {
        Logger.info('Goodbye!');
        Logger.info('');
        return;
      }

      // 显示 provider 信息
      const providerInfo = subConfig.subscribes[selectedProvider];
      Logger.info('');
      Logger.info(`Provider: ${chalk.bold(selectedProvider)}`);
      Logger.info(`Status: ${formatStatus(providerInfo.status)}`);
      Logger.info(`Agents: ${providerInfo.providers.join(', ')}`);
      Logger.info('');

      // Agent 选择循环
      while (true) {
        const agentChoices = providerInfo.providers.map((agentName) => {
          const hasPath = Applier.hasConfigPath(agentName);
          const currentProvider = subConfig.setting[agentName]?.provider;
          const isCurrent = currentProvider === selectedProvider;

          let name = agentName;
          if (isCurrent) {
            name = `${chalk.green('✓')} ${chalk.bold(agentName)} ${chalk.gray('(current)')}`;
          } else {
            name = chalk.white(agentName);
          }

          if (!hasPath) {
            name += chalk.yellow(' (no path)');
          }

          return {
            name,
            value: agentName,
            description: hasPath
              ? Applier.getConfigPath(agentName)
              : 'No config path mapping found',
          };
        });

        // 添加返回和退出选项
        agentChoices.push(
          {
            name: chalk.gray('← Back to provider selection'),
            value: '__back__',
            description: 'Return to provider selection',
          },
          {
            name: chalk.gray('← Exit'),
            value: '__exit__',
            description: 'Exit the switch menu',
          }
        );

        // 选择 agent
        const selectedAgent = await select({
          message: 'Select an agent to apply configuration:',
          choices: agentChoices,
        });

        if (selectedAgent === '__exit__') {
          Logger.info('Goodbye!');
          Logger.info('');
          return;
        }

        if (selectedAgent === '__back__') {
          break; // 返回 provider 选择
        }

        // 检查是否有配置路径
        if (!Applier.hasConfigPath(selectedAgent)) {
          Logger.warn(`No config path mapping for ${selectedAgent}`);
          Logger.info('You can add the path mapping in constants/index.ts');
          Logger.info('');
          continue;
        }

        // 读取 agent 配置
        const agentConfig = await Storage.readAgentConfig(
          selectedProvider,
          selectedAgent
        );

        if (!agentConfig) {
          Logger.error(`Agent config not found: ${selectedProvider}/${selectedAgent}`);
          continue;
        }

        // 应用配置
        const success = await Applier.applyAgentConfig(
          selectedAgent,
          agentConfig.setting,
          false, // 需要用户确认
          agentConfig.export_env
        );

        if (success) {
          // 更新 setting 字段
          const updatedSubConfig = await Storage.readSubConfig();
          updatedSubConfig.setting[selectedAgent] = {
            provider: selectedProvider,
          };
          await Storage.writeSubConfig(updatedSubConfig);
        }

        Logger.info('');
      }
    }
  } catch (error) {
    // 如果是用户取消（Ctrl+C），优雅退出
    if (error instanceof Error && error.name === 'ExitPromptError') {
      Logger.info('');
      Logger.info('Operation cancelled.');
      Logger.info('');
      return;
    }

    Logger.error(
      `Switch failed: ${error instanceof Error ? error.message : String(error)}`
    );
    Logger.info('');
    process.exit(1);
  }
}
