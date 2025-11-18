import { SkillManager } from '../../core/skill-manager.js';
import { Logger } from '../../utils/logger.js';
import type { SkillInstallOptions } from '../../types/skill.js';

/**
 * skill add 命令处理器
 * @param url - Skill 来源 URL
 * @param options - 命令选项
 */
export async function addCommand(
  url: string,
  options: {
    target?: string;
    global?: boolean;
    force?: boolean;
    verbose?: boolean;
  }
): Promise<void> {
  try {
    const skillOptions: SkillInstallOptions = {
      targetAgent: (options.target as 'claude') || 'claude',
      isGlobal: options.global || false,
      force: options.force || false,
      verbose: options.verbose || false,
    };

    // 验证必填参数
    if (!url) {
      Logger.error('URL is required');
      Logger.info('Usage: ff skill add <url> [options]');
      process.exit(1);
    }

    Logger.info('🚀 Starting skill installation...');
    Logger.info('');

    // 执行安装
    await SkillManager.install(url, skillOptions);

    Logger.info('');
    Logger.success('Skill installation completed!');
    Logger.info('');

    // 显示使用提示
    Logger.info('Next steps:');
    Logger.info('  • The skill is now available for Claude');
    Logger.info('  • Restart Claude Code if it is already running');
    Logger.info('  • Use "ff skill list" to view installed skills');
    Logger.info('');
  } catch (error) {
    Logger.error(
      `Failed to install skill: ${error instanceof Error ? error.message : String(error)}`
    );
    Logger.info('');

    if (options.verbose) {
      console.error(error);
    }

    process.exit(1);
  }
}
