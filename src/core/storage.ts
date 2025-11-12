import { existsSync } from 'fs';
import fs from 'fs-extra';

const { ensureDir, readJSON, writeJSON, pathExists, copy, remove } = fs;
import { join, dirname } from 'path';
import type { SubConfig } from '../types/config.js';
import type { ProviderConfig } from '../types/provider.js';
import type { AgentConfig } from '../types/agent.js';
import { createDefaultSubConfig } from '../types/config.js';
import { FF_HOME, SUB_CONFIG_FILE, BACKUPS_DIR, MAX_BACKUPS } from '../constants/index.js';
import { Logger } from '../utils/logger.js';

/**
 * 存储管理类
 */
export class Storage {
  /**
   * 初始化 Flyfree 配置目录
   */
  static async initialize(): Promise<void> {
    try {
      // 确保 ~/.ff 目录存在
      await ensureDir(FF_HOME);
      Logger.debug(`Initialized FF_HOME: ${FF_HOME}`);

      // 确保 backups 目录存在
      await ensureDir(BACKUPS_DIR);
      Logger.debug(`Initialized BACKUPS_DIR: ${BACKUPS_DIR}`);

      // 如果 sub.json 不存在，创建默认配置
      if (!(await pathExists(SUB_CONFIG_FILE))) {
        // 直接写入，避免循环调用 initialize
        await writeJSON(SUB_CONFIG_FILE, createDefaultSubConfig(), { spaces: 2 });
        Logger.debug('Created default sub.json');
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize Flyfree directories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 读取 sub.json
   */
  static async readSubConfig(): Promise<SubConfig> {
    try {
      await this.initialize();
      return await readJSON(SUB_CONFIG_FILE);
    } catch (error) {
      throw new Error(
        `Failed to read sub.json: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 写入 sub.json
   */
  static async writeSubConfig(config: SubConfig): Promise<void> {
    try {
      await this.initialize();
      await writeJSON(SUB_CONFIG_FILE, config, { spaces: 2 });
      Logger.debug('Updated sub.json');
    } catch (error) {
      throw new Error(
        `Failed to write sub.json: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 读取 Provider 配置
   */
  static async readProviderConfig(providerName: string): Promise<ProviderConfig | null> {
    try {
      const configPath = join(FF_HOME, providerName, 'config.json');
      if (!(await pathExists(configPath))) {
        return null;
      }
      return await readJSON(configPath);
    } catch (error) {
      throw new Error(
        `Failed to read provider config for ${providerName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 写入 Provider 配置
   */
  static async writeProviderConfig(
    providerName: string,
    config: ProviderConfig
  ): Promise<void> {
    try {
      const providerDir = join(FF_HOME, providerName);
      await ensureDir(providerDir);

      const configPath = join(providerDir, 'config.json');
      await writeJSON(configPath, config, { spaces: 2 });
      Logger.debug(`Updated provider config: ${providerName}`);
    } catch (error) {
      throw new Error(
        `Failed to write provider config for ${providerName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 读取 Agent 配置
   */
  static async readAgentConfig(
    providerName: string,
    agentName: string
  ): Promise<AgentConfig | null> {
    try {
      const configPath = join(FF_HOME, providerName, agentName, 'config.json');
      if (!(await pathExists(configPath))) {
        return null;
      }
      return await readJSON(configPath);
    } catch (error) {
      throw new Error(
        `Failed to read agent config for ${providerName}/${agentName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 写入 Agent 配置
   */
  static async writeAgentConfig(
    providerName: string,
    agentName: string,
    config: AgentConfig
  ): Promise<void> {
    try {
      const agentDir = join(FF_HOME, providerName, agentName);
      await ensureDir(agentDir);

      const configPath = join(agentDir, 'config.json');
      await writeJSON(configPath, config, { spaces: 2 });
      Logger.debug(`Updated agent config: ${providerName}/${agentName}`);
    } catch (error) {
      throw new Error(
        `Failed to write agent config for ${providerName}/${agentName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 检查文件是否存在
   */
  static async exists(filepath: string): Promise<boolean> {
    return await pathExists(filepath);
  }

  /**
   * 读取 JSON 文件
   */
  static async readJSON<T = unknown>(filepath: string): Promise<T> {
    try {
      return await readJSON(filepath);
    } catch (error) {
      throw new Error(
        `Failed to read JSON file ${filepath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 写入 JSON 文件
   */
  static async writeJSON(filepath: string, data: unknown): Promise<void> {
    try {
      await ensureDir(dirname(filepath));
      await writeJSON(filepath, data, { spaces: 2 });
    } catch (error) {
      throw new Error(
        `Failed to write JSON file ${filepath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 写入原始文本文件（不进行 JSON 处理）
   */
  static async writeRawText(filepath: string, content: string): Promise<void> {
    try {
      await ensureDir(dirname(filepath));
      await fs.writeFile(filepath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to write text file ${filepath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 创建备份
   */
  static async backup(sourcePath: string, agentName: string): Promise<string> {
    try {
      if (!(await pathExists(sourcePath))) {
        Logger.debug(`Backup skipped: ${sourcePath} does not exist`);
        return '';
      }

      // 生成 YYYYMMDDHHMMSS 格式的文件名
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const second = String(now.getSeconds()).padStart(2, '0');
      
      const dateFilename = `${year}${month}${day}${hour}${minute}${second}`;
      
      const backupDir = join(BACKUPS_DIR, agentName);
      await ensureDir(backupDir);

      const backupPath = join(backupDir, `${dateFilename}.json`);
      await copy(sourcePath, backupPath);
      Logger.debug(`Created backup: ${backupPath}`);

      // 清理超出数量限制的旧备份
      await this.cleanupOldBackups(agentName);

      return backupPath;
    } catch (error) {
      throw new Error(
        `Failed to create backup for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 删除 provider 目录
   */
  static async removeProvider(providerName: string): Promise<void> {
    try {
      const providerDir = join(FF_HOME, providerName);
      if (await pathExists(providerDir)) {
        await remove(providerDir);
        Logger.debug(`Removed provider directory: ${providerName}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to remove provider ${providerName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取备份目录路径
   */
  static getBackupsDir(): string {
    return BACKUPS_DIR;
  }

  /**
   * 清理超出数量限制的旧备份文件
   * @param agentName - Agent 名称
   */
  static async cleanupOldBackups(agentName: string): Promise<void> {
    try {
      const agentBackupDir = join(BACKUPS_DIR, agentName);
      
      if (!(await pathExists(agentBackupDir))) {
        return;
      }

      const backupFiles = await fs.readdir(agentBackupDir);
      const jsonBackupFiles = backupFiles.filter(file => file.endsWith('.json'));
      
      if (jsonBackupFiles.length <= MAX_BACKUPS) {
        return; // 没有超出限制，无需清理
      }

      // 解析备份文件并按时间排序（最新的在前）
      const backupsWithTime = jsonBackupFiles.map(file => {
        const filename = file.replace('.json', '');
        let timestamp: number;
        
        // 检查是否为新的日期格式 YYYYMMDDHHMMSS
        if (/^\d{14}$/.test(filename)) {
          const year = parseInt(filename.substring(0, 4));
          const month = parseInt(filename.substring(4, 6)) - 1;
          const day = parseInt(filename.substring(6, 8));
          const hour = parseInt(filename.substring(8, 10));
          const minute = parseInt(filename.substring(10, 12));
          const second = parseInt(filename.substring(12, 14));
          
          timestamp = new Date(year, month, day, hour, minute, second).getTime();
        } else {
          // 兼容旧的时间戳格式
          timestamp = parseInt(filename);
        }
        
        return { file, timestamp };
      }).sort((a, b) => b.timestamp - a.timestamp);

      // 删除超出限制的旧备份
      const filesToDelete = backupsWithTime.slice(MAX_BACKUPS);
      
      for (const backup of filesToDelete) {
        const filePath = join(agentBackupDir, backup.file);
        await remove(filePath);
        Logger.debug(`Deleted old backup: ${filePath}`);
      }

      if (filesToDelete.length > 0) {
        Logger.debug(`Cleaned up ${filesToDelete.length} old backup(s) for ${agentName}, keeping ${MAX_BACKUPS} most recent`);
      }
    } catch (error) {
      Logger.warn(`Failed to cleanup old backups for ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
