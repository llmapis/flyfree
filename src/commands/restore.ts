import { confirm, select } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'node:path';
import { Storage } from '../core/storage.js';
import { Applier } from '../core/applier.js';
import { Logger } from '../utils/logger.js';

interface RestoreOptions {
  list?: boolean;
}

interface BackupFile {
  name: string;
  timestamp: number;
  path: string;
  date: string;
}

/**
 * Restore command - restore agent configurations from backups
 */
export async function restoreCommand(agentName?: string, options?: RestoreOptions): Promise<void> {
  try {
    const backupsDir = Storage.getBackupsDir();

    if (!await fs.pathExists(backupsDir)) {
      Logger.warn('No backup directory found');
      Logger.info('');
      return;
    }

    // 获取所有备份文件
    const agentDirs = await fs.readdir(backupsDir);
    if (agentDirs.length === 0) {
      Logger.warn('No backup files found');
      Logger.info('');
      return;
    }

    // 如果指定了 agent，只处理该 agent
    let targetAgent: string;
    if (agentName) {
      if (!agentDirs.includes(agentName)) {
        Logger.error(`No backups found for agent '${agentName}'`);
        const availableAgents = agentDirs.sort();
        Logger.info(`Available agents with backups: ${availableAgents.join(', ')}`);
        Logger.info('');
        return;
      }
      targetAgent = agentName;
    } else {
      // 列出模式
      if (options?.list) {
        await listBackups(agentDirs, backupsDir);
        return;
      }

      // 交互式选择 agent
      targetAgent = await select({
        message: 'Select agent to restore:',
        choices: agentDirs.sort().map(agent => ({
          name: agent,
          value: agent,
        })),
      });
    }

    // 获取该 agent 的备份文件
    const agentBackupDir = path.join(backupsDir, targetAgent);
    const backupFiles = await fs.readdir(agentBackupDir);
    
    if (backupFiles.length === 0) {
      Logger.warn(`No backup files found for agent '${targetAgent}'`);
      Logger.info('');
      return;
    }

    // 解析备份文件并按时间排序
    const backups: BackupFile[] = backupFiles
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filename = file.replace('.json', '');
        let timestamp: number;
        let date: Date;
        
        // 检查是否为新的日期格式 YYYYMMDDHHMMSS
        if (/^\d{14}$/.test(filename)) {
          const year = parseInt(filename.substring(0, 4));
          const month = parseInt(filename.substring(4, 6)) - 1; // JS months are 0-indexed
          const day = parseInt(filename.substring(6, 8));
          const hour = parseInt(filename.substring(8, 10));
          const minute = parseInt(filename.substring(10, 12));
          const second = parseInt(filename.substring(12, 14));
          
          date = new Date(year, month, day, hour, minute, second);
          timestamp = date.getTime();
        } else {
          // 兼容旧的时间戳格式
          timestamp = parseInt(filename);
          date = new Date(timestamp);
        }
        
        return {
          name: file,
          timestamp,
          path: path.join(agentBackupDir, file),
          date: date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    // 选择备份文件
    const selectedBackup = await select({
      message: 'Select backup to restore:',
      choices: backups.map(backup => ({
        name: `${backup.date} (${backup.name})`,
        value: backup,
      })),
    });

    // 显示备份内容预览
    try {
      const backupContent = await fs.readJson(selectedBackup.path);
      Logger.info('');
      Logger.info('Backup content preview:');
      Logger.info(JSON.stringify(backupContent, null, 2));
      Logger.info('');
    } catch (error) {
      Logger.warn('Failed to preview backup content');
      Logger.info('');
    }

    // 确认恢复
    const confirmed = await confirm({
      message: `Restore ${targetAgent} configuration from ${selectedBackup.date}?`,
      default: false,
    });

    if (!confirmed) {
      Logger.info('Operation cancelled');
      Logger.info('');
      return;
    }

    // 执行恢复
    Logger.info('Restoring configuration...');
    
    try {
      const backupContent = await fs.readJson(selectedBackup.path);
      const configPath = Applier.getConfigPath(targetAgent);
      
      if (!configPath) {
        throw new Error(`No config path mapping found for agent: ${targetAgent}`);
      }

      // 创建当前配置的备份（作为恢复前的备份）
      const currentConfig = await Applier.readCurrentConfig(targetAgent);
      if (currentConfig !== null) {
        const preRestoreBackupPath = path.join(
          Storage.getBackupsDir(),
          targetAgent,
          `${Date.now()}-pre-restore.json`
        );
        await fs.ensureDir(path.dirname(preRestoreBackupPath));
        await fs.writeJSON(preRestoreBackupPath, currentConfig, { spaces: 2 });
        Logger.info(`Pre-restore backup created: ${preRestoreBackupPath}`);
      }

      // 应用备份配置
      if (typeof backupContent === 'string') {
        await Storage.writeRawText(configPath, backupContent);
      } else {
        await Storage.writeJSON(configPath, backupContent);
      }

      Logger.success(`Successfully restored ${targetAgent} configuration`);
      Logger.info(`Config path: ${configPath}`);
      Logger.info(`Restored from: ${selectedBackup.name}`);
      Logger.info('');
    } catch (error) {
      Logger.error(`Failed to restore configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Logger.info('');
    }
  } catch (error) {
    Logger.error(`Restore command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    Logger.info('');
    process.exit(1);
  }
}

/**
 * 列出所有备份文件
 */
async function listBackups(agentDirs: string[], backupsDir: string): Promise<void> {
  Logger.info('Available backups:');
  Logger.info('');

  for (const agent of agentDirs.sort()) {
    const agentBackupDir = path.join(backupsDir, agent);
    const backupFiles = await fs.readdir(agentBackupDir);
    
    const backups = backupFiles
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filename = file.replace('.json', '');
        let timestamp: number;
        let date: Date;
        
        // 检查是否为新的日期格式 YYYYMMDDHHMMSS
        if (/^\d{14}$/.test(filename)) {
          const year = parseInt(filename.substring(0, 4));
          const month = parseInt(filename.substring(4, 6)) - 1; // JS months are 0-indexed
          const day = parseInt(filename.substring(6, 8));
          const hour = parseInt(filename.substring(8, 10));
          const minute = parseInt(filename.substring(10, 12));
          const second = parseInt(filename.substring(12, 14));
          
          date = new Date(year, month, day, hour, minute, second);
          timestamp = date.getTime();
        } else {
          // 兼容旧的时间戳格式
          timestamp = parseInt(filename);
          date = new Date(timestamp);
        }
        
        return {
          name: file,
          timestamp,
          date: date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    if (backups.length > 0) {
      Logger.info(`${agent}:`);
      backups.forEach(backup => {
        Logger.info(`  ${backup.date} - ${backup.name}`);
      });
      Logger.info('');
    }
  }
}