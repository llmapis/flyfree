import { homedir } from "os";
import { join } from "path";
import { CLAUDE_CODE, CODEX } from "./agents.js";

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
 * 支持的 Agent 类型
 */
export const AGENT_TYPES = {
  CLAUDE_CODE,
  CODEX,
} as const;

export type AgentType = (typeof AGENT_TYPES)[keyof typeof AGENT_TYPES];

/**
 * Agent 配置文件路径映射
 * 采用可扩展的设计，未知的 agent 路径可后续添加
 */
export const AGENT_CONFIG_PATHS: Record<string, string> = {
  [CLAUDE_CODE]: join(homedir(), ".claude", "settings.json"),
  // 其他 agent 路径可后续添加
  [CODEX]: join(homedir(), ".codex", "config.toml"),
  // 'qwen-cli': join(homedir(), '.qwen', 'config.json'),
};

export const AGENT_START_COMMAND: Record<string, string> = {
  [CLAUDE_CODE]: "claude",
  // 其他 agent 路径可后续添加
  [CODEX]: "codex",
  // 'qwen-cli': join(homedir(), '.qwen', 'config.json'),
};

/**
 * Skill 配置文件路径
 */
export const SKILL_CONFIG_FILE = join(FF_HOME, "skill.json");

/**
 * Claude 全局 Skills 目录路径
 */
export const CLAUDE_GLOBAL_SKILLS_DIR = join(homedir(), ".claude", "skills");

/**
 * 支持的 agent 列表（Skill 功能支持的 agent）
 */
export const SUPPORTED_AGENTS_FOR_SKILL = ["claude"] as const;

/**
 * Skill 目录名称
 */
export const SKILL_DIR_NAME = ".claude";

/**
 * Skill 文件名
 */
export const SKILL_FILENAME = "SKILL.md";

/**
 * Skill 搜索的最大深度（递归搜索层级限制）
 */
export const MAX_SKILL_SEARCH_DEPTH = 5;

/**
 * Skill 下载并发数限制
 */
export const MAX_CONCURRENT_DOWNLOADS = 5;
