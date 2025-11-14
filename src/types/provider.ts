/**
 * Provider 支持的功能
 */
export type ProviderFunction = "balance" | "usage";

/**
 * Agent 的配置信息
 */
export interface AgentProviderConfig {
  /** Agent 名称 */
  name: string;
  /** 当前配置的哈希值 */
  hash: string;
  /** Agent 的配置内容（JSON 原始消息） */
  setting: unknown;
  /** Export Env */
  export_env?: Record<string, string>;
}

/**
 * Provider 配置的 payload
 */
export interface ProviderPayload {
  /** 该供应商支持的 agents */
  providers: AgentProviderConfig[];
  /** 该供应商支持的能力 */
  functions: ProviderFunction[];
}

/**
 * Provider 的完整配置（{provider name}/config.json）
 */
export interface ProviderConfig {
  /** 供应商名称 */
  name: string;
  /** 订阅 URL */
  sub_url: string;
  /** 当前订阅内容的 hash 值 */
  hash: string;
  /** 上一次更新时间（秒级时间戳） */
  updated_at: number;
  /** 配置内容 */
  payload: ProviderPayload;
}

/**
 * 订阅响应的元数据信息
 */
export interface SubscribeResponseMeta {
  /** 请求ID */
  request_id: string;
  /** 错误码 */
  code: number;
  /** 错误信息 */
  message: string;
}

/**
 * 订阅响应的数据部分
 */
export interface SubscribeResponseData {
  /** 供应商名称 */
  name: string;
  /** 供应商描述 */
  description: string;
  /** 配置内容 */
  payload: ProviderPayload;
}

/**
 * 订阅 URL 的响应格式
 */
export interface SubscribeResponse {
  /** 响应元数据（包含错误信息） */
  meta: SubscribeResponseMeta;
  /** 响应数据 */
  data: SubscribeResponseData;
}
