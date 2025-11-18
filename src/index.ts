#!/usr/bin/env node

import { Command } from 'commander';
import { subscribeCommand } from './commands/subscribe.js';
import { switchCommand } from './commands/switch.js';
import { listCommand } from './commands/list.js';
import { unsubscribeCommand } from './commands/unsubscribe.js';
import { resetCommand } from './commands/reset.js';
import { setCommand } from './commands/set.js';
import { restoreCommand } from './commands/restore.js';
import { registerSkillCommand } from './commands/skill/index.js';
import { Logger } from './utils/logger.js';

// 全局错误处理
process.on('uncaughtException', (error) => {
  Logger.error(`Unexpected error: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled promise rejection: ${reason}`);
  if (process.env.DEBUG) {
    console.error(reason);
  }
  process.exit(1);
});

const program = new Command();

program
  .name('flyfree')
  .alias('ff')
  .description('A CLI tool for managing LLM Provider configurations')
  .version('0.2.0');

// Subscribe 命令
program
  .command('sub <url>')
  .description('Subscribe to a provider configuration')
  .option('-a, --alias <name>', 'Set provider alias name')
  .option('--auto', 'Automatically apply configuration')
  .option('-s, --select [agents]', 'Select agents to apply (interactive or comma-separated list)')
  .action(subscribeCommand);

// Switch 命令
program
  .command('switch')
  .alias('s')
  .description('Switch provider configuration interactively')
  .action(switchCommand);

// List 命令
program
  .command('list')
  .alias('ls')
  .description('List all subscribed providers')
  .action(listCommand);

// Unsubscribe 命令
program
  .command('unsub <provider>')
  .description('Unsubscribe from a provider')
  .option('-f, --force', 'Force unsubscribe without confirmation')
  .action(unsubscribeCommand);

// Reset 命令
program
  .command('reset [agent]')
  .description('Reset agent configurations (interactive or specific agent)')
  .option('-f, --force', 'Force reset without confirmation')
  .action(resetCommand);

// Set 命令
program
  .command('set <agent> <provider>')
  .description('Quickly switch agent provider configuration')
  .action(setCommand);

// Restore 命令
program
  .command('restore [agent]')
  .description('Restore agent configurations from backups')
  .option('-l, --list', 'List all available backups')
  .action(restoreCommand);

// Skill 命令
registerSkillCommand(program);

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
