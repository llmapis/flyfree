import type { SubscribeResponse } from './provider.js';

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
) => SubscribeResponse | Promise<SubscribeResponse>;

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
