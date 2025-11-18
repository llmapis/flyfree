import { SkillManager } from '../../core/skill-manager.js';
import { Logger } from '../../utils/logger.js';

/**
 * skill update 命令处理器
 * @param skillName - Skill 名称
 * @param options - 命令选项
 */
export async function updateCommand(
  skillName: string,
  options: {
    target?: string;
    global?: boolean;
  }
): Promise<void> {
  try {
    // 验证必填参数
    if (!skillName) {
      Logger.error('Skill name is required');
      Logger.info('Usage: ff skill update <skill-name> [options]');
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

    Logger.info(`Checking for updates: ${skillName}`);
    Logger.info(`Current version: ${skillInfo.version || 'unknown'}`);
    Logger.info(`Last updated: ${new Date(skillInfo.lastUpdated * 1000).toLocaleString()}`);
    Logger.info('');

    // 执行更新
    await SkillManager.update(skillName, targetAgent, isGlobal);

    Logger.info('');
    Logger.success('Skill updated successfully!');
    Logger.info('');
  } catch (error) {
    Logger.error(
      `Failed to update skill: ${error instanceof Error ? error.message : String(error)}`
    );
    Logger.info('');
    process.exit(1);
  }
}
