import type { BuiltinProvider } from "../types/builtin.js";
import type { SubscribeResponse } from "../types/provider.js";
import {
  zaiProvider,
  openrouterProvider,
  miniMaxProvider,
} from "./providers/index.js";

/**
 * 内置 Provider 注册表
 */
class BuiltinProviderRegistry {
  private providers: Map<string, BuiltinProvider> = new Map();

  /**
   * 注册一个内置 Provider
   */
  register(provider: BuiltinProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * 获取内置 Provider
   */
  get(id: string): BuiltinProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * 检查是否存在指定的 Provider
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * 获取所有内置 Provider
   */
  getAll(): BuiltinProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 列出所有内置 Provider ID
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * 全局内置 Provider 注册表实例
 */
export const builtinProviders = new BuiltinProviderRegistry();

// ============================================================================
// 注册所有内置 Provider
// ============================================================================

builtinProviders.register(zaiProvider);
builtinProviders.register(miniMaxProvider);
builtinProviders.register(openrouterProvider);

/**
 * 解析 ff:// 协议 URL
 */
export function parseBuiltinUrl(
  url: string
): { id: string; params: URLSearchParams } | null {
  if (!url.startsWith("ff://")) {
    return null;
  }

  try {
    const urlWithoutProtocol = url.substring(5);
    const [host, queryString] = urlWithoutProtocol.split("?");
    const params = new URLSearchParams(queryString || "");

    return {
      id: host,
      params,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 处理内置 Provider 订阅
 */
export async function handleBuiltinProvider(
  url: string
): Promise<SubscribeResponse | null> {
  const parsed = parseBuiltinUrl(url);

  if (!parsed) {
    return null;
  }

  const provider = builtinProviders.get(parsed.id);

  if (!provider) {
    throw new Error(
      "Unknown built-in provider: " +
        parsed.id +
        "\n" +
        "Available providers: " +
        builtinProviders.list().join(", ")
    );
  }

  const response = await provider.handler({
    params: parsed.params,
    url,
  });

  return response;
}
