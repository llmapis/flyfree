/**
 * 订阅状态
 */
export type SubscribeStatus = "success" | "failed" | "pending";

/**
 * 单个订阅信息
 */
export interface SubscribeInfo {
  /** 订阅 URL */
  sub_url: string;
  /** 该供应商支持的 agents */
  providers: string[];
  /** 上一次订阅更新的状态 */
  status: SubscribeStatus;
  /** 上一次更新时间（秒级时间戳） */
  updated_at: number;
  /** 当前订阅内容的 hash 值 */
  hash: string;
  /** 上一次更新订阅失败时获取到的响应内容，成功则留空 */
  latest_response_message: string;
}

/**
 * Agent 使用的配置信息
 */
export interface AgentSetting {
  /** 当前使用的 provider 名称 */
  provider: string;
  /** 预留扩展字段 */
  [key: string]: unknown;
}

/**
 * sub.json 的完整结构
 */
export interface SubConfig {
  /** 所有订阅信息 */
  subscribes: Record<string, SubscribeInfo>;
  /** Agent 当前使用的配置 */
  setting: Record<string, AgentSetting>;
}

/**
 * 创建默认的 SubConfig
 */
export function createDefaultSubConfig(): SubConfig {
  return {
    subscribes: {},
    setting: {},
  };
}
