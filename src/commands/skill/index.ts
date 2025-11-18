import { Command } from 'commander';
import { addCommand } from './add.js';
import { delCommand } from './del.js';
import { listCommand } from './list.js';
import { updateCommand } from './update.js';
import { SUPPORTED_AGENTS_FOR_SKILL } from '../../constants/index.js';

/**
 * 注册 skill 命令组
 * @param program - Commander 程序实例
 */
export function registerSkillCommand(program: Command): void {
  const skillCommand = new Command('skill')
    .description('Manage Agent Skills for Claude')
    .alias('sk');

  // skill add 命令
  skillCommand
    .command('add <url>')
    .description('Install a Skill from URL')
    .option('-t, --target <agent>', 'Target agent', 'claude')
    .option('-g, --global', 'Install globally')
    .option('-f, --force', 'Force overwrite if skill exists')
    .option('-v, --verbose', 'Verbose output')
    .action(addCommand);

  // skill del 命令
  skillCommand
    .command('del <skill-name>')
    .description('Remove an installed Skill')
    .option('-t, --target <agent>', 'Target agent', 'claude')
    .option('-g, --global', 'Remove from global installation')
    .option('-f, --force', 'Force removal without confirmation')
    .action(delCommand);

  // skill list 命令
  skillCommand
    .command('list')
    .alias('ls')
    .description('List installed Skills')
    .option('-t, --target <agent>', 'Filter by agent')
    .option('-g, --global', 'Show only global skills')
    .option('-l, --local', 'Show only local skills')
    .action(listCommand);

  // skill update 命令
  skillCommand
    .command('update <skill-name>')
    .description('Update a Skill to the latest version')
    .option('-t, --target <agent>', 'Target agent', 'claude')
    .option('-g, --global', 'Update from global installation')
    .action(updateCommand);

  // 注册到主程序
  program.addCommand(skillCommand);

  // 全局添加 agent 选项的验证
  skillCommand.hook('preSubcommand', () => {
    // 可以在这里添加全局验证逻辑
  });
}
