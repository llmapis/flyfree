import { createHash } from 'crypto';

/**
 * 清理配置字符串
 * - 移除前后空白字符
 * - 移除前后空行
 * - 保留内容中间的格式
 */
export function cleanConfigString(content: string): string {
  return content.trim();
}

/**
 * 计算字符串的 SHA-256 哈希值
 */
export function calculateHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * 计算对象的 SHA-256 哈希值
 */
export function calculateObjectHash(obj: unknown): string {
  const jsonString = JSON.stringify(obj, null, 0);
  return calculateHash(jsonString);
}

/**
 * 验证内容的哈希值
 */
export function verifyHash(content: string, expectedHash: string): boolean {
  const actualHash = calculateHash(content);
  return actualHash === expectedHash;
}
