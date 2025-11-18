import { input, confirm } from '@inquirer/prompts';
import { SkillManager } from '../../core/skill-manager.js';
import { Logger } from '../../utils/logger.js';

/**
 * skill del 命令处理器
 * @param skillName - Skill 名称
 * @param options - 命令选项
 */
export async function delCommand(
  skillName: string,
  options: {
    target?: string;
    global?: boolean;
    force?: boolean;
  }
): Promise<void> {
  try {
    // 验证必填参数
    if (!skillName) {
      Logger.error('Skill name is required');
      Logger.info('Usage: ff skill del <skill-name> [options]');
      process.exit(1);
    }

    const targetAgent = (options.target as 'claude') || 'claude';
    const isGlobal = options.global || false;

    // 检查 Skill 是否存在
    const skillInfo = await SkillManager.getSkillInfo(skillName);

    if (!skillInfo) {
      Logger.error(`Skill "${skillName}" not found`);
      Logger.info('Use "ff skill list" to see installed skills');
      process.exit(1);
    }

    // 显示 Skill 信息
    Logger.info(`About to remove skill: ${skillName}`);
    Logger.info(`Location: ${skillInfo.localPath}`);
    Logger.info(`Agent: ${skillInfo.targetAgent}`);
    Logger.info('');

    // 确认删除
    if (!options.force) {
      const answer = await confirm({
        message: 'Are you sure you want to remove this skill?',
        default: false,
      });

      if (!answer) {
        Logger.info('Operation cancelled');
        process.exit(0);
      }
    }

    Logger.info('Removing skill...');

    // 执行卸载
    await SkillManager.uninstall(skillName, targetAgent, isGlobal, options.force || false);

    Logger.info('');
    Logger.success('Skill removed successfully!');
    Logger.info('');
  } catch (error) {
    Logger.error(
      `Failed to remove skill: ${error instanceof Error ? error.message : String(error)}`
    );
    Logger.info('');
    process.exit(1);
  }
}
