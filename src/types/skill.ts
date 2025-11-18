/**
 * Skill 信息接口
 * 表示一个已安装的 Skill 的详细信息
 */
export interface SkillInfo {
  // 基本信息
  /** skill 名称（来自 SKILL.md 的 name 字段） */
  name: string;
  /** skill 描述（来自 SKILL.md 的 description 字段） */
  description: string;
  /** 来源 URL */
  url: string;

  // 安装信息
  /** 目标 agent（目前仅支持 'claude'） */
  targetAgent: 'claude';
  /** 是否全局安装 */
  isGlobal: boolean;
  /** 安装时间（Unix 时间戳，秒） */
  installedAt: number;
  /** 最后更新时间（Unix 时间戳，秒） */
  lastUpdated: number;
  /** 目录内容 hash（用于检测更新） */
  hash: string;
  /** 本地路径 */
  localPath: string;

  // 可选字段
  /** 版本信息（可选） */
  version?: string;
  /** 允许使用的工具列表（可选） */
  allowedTools?: string[];
}

/**
 * skill.json 配置文件的完整结构
 */
export interface SkillConfig {
  /** 所有已安装的 Skills，key 为 skill 名称 */
  skills: Record<string, SkillInfo>;
}

/**
 * SKILL.md 验证结果
 */
export interface SkillValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 验证错误列表 */
  errors?: string[];
  /** 解析后的 YAML 数据 */
  data?: {
    name?: string;
    description?: string;
    version?: string;
    allowedTools?: string[];
  };
}

/**
 * Skill 安装选项
 */
export interface SkillInstallOptions {
  /** 目标 agent */
  targetAgent: 'claude';
  /** 是否全局安装 */
  isGlobal: boolean;
  /** 覆盖已存在的 skill */
  force?: boolean;
  /** 详细输出 */
  verbose?: boolean;
}

/**
 * 远程搜索结果
 */
export interface RemoteSkillSearchResult {
  /** 找到的 Skill 路径 */
  path: string;
  /** Skill 名称 */
  name: string;
  /** 是否有效 */
  valid: boolean;
  /** 验证错误 */
  errors?: string[];
}
