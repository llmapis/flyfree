/**
 * Agent 配置文件结构（{provider}/{agent}/config.json）
 */
export interface AgentConfig {
  /** Agent 名称 */
  name: string;
  /** 当前配置的哈希值 */
  hash: string;
  /** 上一次更新时间（秒级时间戳） */
  updated_at: number;
  /** Agent 的实际配置内容（JSON 原始消息） */
  setting: unknown;
  /** Export Env */
  export_env?: Record<string, string>;
}

/**
 * Agent 信息（用于展示和选择）
 */
export interface AgentInfo {
  /** Agent 名称 */
  name: string;
  /** Agent 配置文件路径（如果已知） */
  configPath?: string;
  /** 是否已配置路径 */
  hasConfigPath: boolean;
}

/**
 * 创建 AgentConfig
 */
export function createAgentConfig(
  name: string,
  hash: string,
  setting: unknown,
  export_env?: Record<string, string>
): AgentConfig {
  return {
    name,
    hash,
    updated_at: Math.floor(Date.now() / 1000),
    setting,
    export_env,
  };
}
