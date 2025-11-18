import chalk from 'chalk';
import { SkillManager } from '../../core/skill-manager.js';
import { Logger } from '../../utils/logger.js';
import type { SkillInfo } from '../../types/skill.js';

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
function formatStatus(skill: SkillInfo): string {
  // 这里可以添加更复杂的状态检查逻辑
  return chalk.green('✓ Active');
}

/**
 * skill list 命令处理器
 * @param options - 命令选项
 */
export async function listCommand(
  options: {
    target?: string;
    global?: boolean;
    local?: boolean;
  }
): Promise<void> {
  try {
    const targetAgent = options.target as 'claude' | undefined;
    const isGlobal = options.global ? true : options.local ? false : undefined;

    // 获取 Skills 列表
    const skills = await SkillManager.list(targetAgent, isGlobal);

    // 显示标题
    console.log('');
    console.log(chalk.bold.cyan('📚 Installed Skills'));
    console.log('');

    if (skills.length === 0) {
      Logger.info('No skills found.');
      Logger.info('');
      Logger.info('To install a skill:');
      Logger.info('  ff skill add <url> -t claude');
      Logger.info('');
      return;
    }

    // 按全局/本地分组
    const globalSkills = skills.filter(s => s.isGlobal);
    const localSkills = skills.filter(s => !s.isGlobal);

    // 显示全局 Skills
    if (globalSkills.length > 0) {
      console.log(chalk.bold('Global Skills') + chalk.gray(` (${globalSkills.length})`));
      console.log(chalk.gray(`  Location: ~/.claude/skills/`));
      console.log('');

      for (const skill of globalSkills) {
        console.log(chalk.cyan(`  • ${skill.name}`));
        console.log(`    Description: ${chalk.gray(skill.description)}`);
        console.log(`    URL: ${chalk.gray(skill.url)}`);
        console.log(`    Status: ${formatStatus(skill)}`);
        console.log(`    Updated: ${chalk.gray(formatTimestamp(skill.lastUpdated))}`);

        if (skill.version) {
          console.log(`    Version: ${chalk.gray(skill.version)}`);
        }

        if (skill.allowedTools && skill.allowedTools.length > 0) {
          console.log(`    Allowed Tools: ${chalk.gray(skill.allowedTools.join(', '))}`);
        }

        console.log('');
      }
    }

    // 显示本地 Skills
    if (localSkills.length > 0) {
      console.log(chalk.bold('Local Skills') + chalk.gray(` (${localSkills.length})`));
      console.log(chalk.gray(`  Location: ./.claude/skills/`));
      console.log('');

      for (const skill of localSkills) {
        console.log(chalk.cyan(`  • ${skill.name}`));
        console.log(`    Description: ${chalk.gray(skill.description)}`);
        console.log(`    URL: ${chalk.gray(skill.url)}`);
        console.log(`    Status: ${formatStatus(skill)}`);
        console.log(`    Updated: ${chalk.gray(formatTimestamp(skill.lastUpdated))}`);

        if (skill.version) {
          console.log(`    Version: ${chalk.gray(skill.version)}`);
        }

        if (skill.allowedTools && skill.allowedTools.length > 0) {
          console.log(`    Allowed Tools: ${chalk.gray(skill.allowedTools.join(', '))}`);
        }

        console.log('');
      }
    }

    // 显示统计信息
    const totalSkills = skills.length;
    const agents = [...new Set(skills.map(s => s.targetAgent))];

    console.log(chalk.bold('Summary:'));
    console.log(`  Total skills: ${chalk.bold(totalSkills)}`);
    console.log(`  Agents: ${chalk.cyan(agents.join(', '))}`);
    console.log(`  Global: ${chalk.bold(globalSkills.length)}`);
    console.log(`  Local: ${chalk.bold(localSkills.length)}`);
    console.log('');
  } catch (error) {
    Logger.error(
      `Failed to list skills: ${error instanceof Error ? error.message : String(error)}`
    );
    Logger.info('');
    process.exit(1);
  }
}
