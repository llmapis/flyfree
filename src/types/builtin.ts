import type { ProviderPayload } from './provider.js';

/**
 * 内置 Provider 的响应格式（旧格式，用于向后兼容）
 */
export interface BuiltinProviderResponse {
  /** 供应商名称 */
  name: string;
  /** 供应商描述 */
  description: string;
  /** 配置内容 */
  payload: ProviderPayload;
}

/**
 * 内置 Provider 处理函数的参数
 */
export interface BuiltinProviderParams {
  /** URL 查询参数 */
  params: URLSearchParams;
  /** 原始 URL */
  url: string;
}

/**
 * 内置 Provider 处理函数
 */
export type BuiltinProviderHandler = (
  params: BuiltinProviderParams
) => BuiltinProviderResponse | Promise<BuiltinProviderResponse>;

/**
 * 内置 Provider 定义
 */
export interface BuiltinProvider {
  /** Provider 标识符（如 z.ai） */
  id: string;
  /** Provider 显示名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 处理函数 */
  handler: BuiltinProviderHandler;
  /** 是否需要 API Key */
  requiresApiKey?: boolean;
  /** API Key 参数名称 */
  apiKeyParam?: string;
}
