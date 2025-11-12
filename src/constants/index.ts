import { homedir } from "os";
import { join } from "path";

/**
 * Flyfree 配置目录路径
 */
export const FF_HOME = join(homedir(), ".ff");

/**
 * 订阅配置文件路径
 */
export const SUB_CONFIG_FILE = join(FF_HOME, "sub.json");

/**
 * 备份目录路径
 */
export const BACKUPS_DIR = join(FF_HOME, "backups");

/**
 * HTTP 请求超时时间（毫秒）
 */
export const HTTP_TIMEOUT = 30000;

/**
 * 最大重试次数
 */
export const MAX_RETRIES = 3;

/**
 * 备份文件保留数量
 */
export const MAX_BACKUPS = 10;

/**
 * Agent 配置文件路径映射
 * 采用可扩展的设计，未知的 agent 路径可后续添加
 */
export const AGENT_CONFIG_PATHS: Record<string, string> = {
  "claude-code": join(homedir(), ".claude", "settings.json"),
  // 其他 agent 路径可后续添加
  // 'codex': join(homedir(), '.codex', 'config.json'),
  // 'qwen-cli': join(homedir(), '.qwen', 'config.json'),
};
