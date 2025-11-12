import { homedir } from 'os';
import { resolve, join } from 'path';

/**
 * 解析路径，支持 ~ 符号
 */
export function resolvePath(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return join(homedir(), filepath.slice(1));
  }
  return resolve(filepath);
}

/**
 * 获取 provider 配置目录
 */
export function getProviderDir(ffHome: string, providerName: string): string {
  return join(ffHome, providerName);
}

/**
 * 获取 provider 配置文件路径
 */
export function getProviderConfigPath(ffHome: string, providerName: string): string {
  return join(getProviderDir(ffHome, providerName), 'config.json');
}

/**
 * 获取 agent 配置文件路径
 */
export function getAgentConfigPath(
  ffHome: string,
  providerName: string,
  agentName: string
): string {
  return join(getProviderDir(ffHome, providerName), agentName, 'config.json');
}

/**
 * 获取备份文件路径
 */
export function getBackupPath(
  backupsDir: string,
  agentName: string,
  timestamp: number
): string {
  return join(backupsDir, agentName, `${timestamp}.json`);
}
