import axios from 'axios';
import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { createHash } from 'crypto';
import {
  CLAUDE_GLOBAL_SKILLS_DIR,
  SKILL_FILENAME,
  MAX_SKILL_SEARCH_DEPTH,
  SUPPORTED_AGENTS_FOR_SKILL,
} from '../constants/index.js';
import { Storage } from './storage.js';
import { Logger } from '../utils/logger.js';
import type {
  SkillInfo,
  SkillConfig,
  SkillValidationResult,
  SkillInstallOptions,
  RemoteSkillSearchResult,
} from '../types/skill.js';

/**
 * Skill 管理器
 * 负责 Skill 的安装、卸载、列表、更新等操作
 */
export class SkillManager {
  /**
   * 验证 URL 格式
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * 将 GitHub URL 转换为 raw 下载 URL
   */
  static async convertToRawUrl(url: string): Promise<string> {
    const githubRegex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/;
    const match = url.match(githubRegex);

    if (match) {
      const [, owner, repo, branch, filePath] = match;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    }

    // 如果不是 GitHub URL，返回原 URL
    return url;
  }

  /**
   * 从 URL 下载内容
   */
  static async downloadFromUrl(url: string): Promise<string> {
    try {
      Logger.debug(`Downloading from: ${url}`);
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'flyfree-skill-manager',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to download from ${url}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 验证 SKILL.md 格式
   */
  static validateSKILLMd(content: string): SkillValidationResult {
    try {
      // 检查 YAML frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        return {
          valid: false,
          errors: ['SKILL.md must contain YAML frontmatter'],
        };
      }

      const yamlContent = match[1];
      let yamlData: any;

      try {
        yamlData = yaml.load(yamlContent);
      } catch (error) {
        return {
          valid: false,
          errors: [`Invalid YAML syntax: ${error instanceof Error ? error.message : String(error)}`],
        };
      }

      // 验证 name 字段
      if (!yamlData.name) {
        return {
          valid: false,
          errors: ['Missing required field: name'],
        };
      }

      if (typeof yamlData.name !== 'string' || yamlData.name.length === 0) {
        return {
          valid: false,
          errors: ['Field "name" must be a non-empty string'],
        };
      }

      // 验证 name 长度
      if (yamlData.name.length > 64) {
        return {
          valid: false,
          errors: ['Field "name" must be less than 64 characters'],
        };
      }

      // 检查是否包含不推荐的字符（空格、大写字母等）
      const hasSpacesOrUpperCase = /[A-Z\s]/.test(yamlData.name);
      if (hasSpacesOrUpperCase) {
        // 允许但警告，官方 SKILL.md 也使用空格和大写字母
        Logger.warn(
          `Field "name" contains spaces or uppercase letters: "${yamlData.name}". ` +
          'Consider using lowercase letters, numbers, and hyphens only for best practices.'
        );
      }

      // 验证不包含特殊字符（除了空格、连字符、字母、数字）
      const invalidChars = yamlData.name.match(/[^a-zA-Z0-9\s-]/g);
      if (invalidChars) {
        return {
          valid: false,
          errors: [
            `Field "name" contains invalid characters: ${invalidChars.join(', ')}. ` +
            'Allowed characters: letters, numbers, spaces, and hyphens.',
          ],
        };
      }

      // 验证 description 字段
      if (!yamlData.description) {
        return {
          valid: false,
          errors: ['Missing required field: description'],
        };
      }

      if (typeof yamlData.description !== 'string' || yamlData.description.length === 0) {
        return {
          valid: false,
          errors: ['Field "description" must be a non-empty string'],
        };
      }

      if (yamlData.description.length > 1024) {
        return {
          valid: false,
          errors: ['Field "description" must be less than 1024 characters'],
        };
      }

      // 验证 allowed-tools（可选）
      if (yamlData.allowedTools && !Array.isArray(yamlData.allowedTools)) {
        return {
          valid: false,
          errors: ['Field "allowedTools" must be an array if provided'],
        };
      }

      return {
        valid: true,
        data: {
          name: yamlData.name,
          description: yamlData.description,
          version: yamlData.version,
          allowedTools: yamlData.allowedTools,
        },
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * 计算目录内容的 hash
   */
  static async calculateDirectoryHash(dirPath: string): Promise<string> {
    const hash = createHash('sha256');

    async function processDirectory(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      // 按名称排序以确保一致性
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const relativePath = path.relative(dirPath, fullPath);

        // 跳过隐藏文件和目录
        if (entry.name.startsWith('.') && entry.name !== SKILL_FILENAME) {
          continue;
        }

        hash.update(relativePath + '\n');

        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          const content = await fs.readFile(fullPath);
          hash.update(content);
        }
      }
    }

    await processDirectory(dirPath);
    return hash.digest('hex');
  }

  /**
   * 搜索远程 SKILL.md 文件
   * 模拟递归搜索（在实际实现中需要下载目录结构）
   */
  static async searchRemoteSKILLMd(baseUrl: string): Promise<RemoteSkillSearchResult[]> {
    // 简化实现：假设 baseUrl 直接指向包含 SKILL.md 的目录
    try {
      const rawUrl = await this.convertToRawUrl(baseUrl);
      const skillMdUrl = `${rawUrl.replace(/\/$/, '')}/${SKILL_FILENAME}`;

      try {
        const content = await this.downloadFromUrl(skillMdUrl);
        const validation = this.validateSKILLMd(content);

        if (validation.valid && validation.data) {
          return [
            {
              path: baseUrl,
              name: validation.data.name || 'unknown',
              valid: true,
            },
          ];
        } else {
          return [
            {
              path: baseUrl,
              name: 'unknown',
              valid: false,
              errors: validation.errors,
            },
          ];
        }
      } catch {
        // 如果直接下载失败，说明该目录可能不包含 SKILL.md
        return [];
      }
    } catch (error) {
      Logger.warn(`Failed to search SKILL.md in ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 安装 Skill
   */
  static async install(url: string, options: SkillInstallOptions): Promise<void> {
    const { targetAgent, isGlobal } = options;

    // 验证 agent 是否支持
    if (!SUPPORTED_AGENTS_FOR_SKILL.includes(targetAgent)) {
      throw new Error(`Unsupported agent: ${targetAgent}. Supported agents: ${SUPPORTED_AGENTS_FOR_SKILL.join(', ')}`);
    }

    // 验证 URL
    if (!this.validateUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    Logger.info(`Installing skill from: ${url}`);
    Logger.info(`Target agent: ${targetAgent}`);
    Logger.info(`Install location: ${isGlobal ? 'Global' : 'Local'}`);

    // 搜索 SKILL.md
    Logger.info('Searching for SKILL.md files...');
    const foundSkills = await this.searchRemoteSKILLMd(url);

    if (foundSkills.length === 0) {
      throw new Error('No SKILL.md found at the specified URL');
    }

    // 过滤有效的 Skills
    const validSkills = foundSkills.filter(s => s.valid);
    const invalidSkills = foundSkills.filter(s => !s.valid);

    if (invalidSkills.length > 0) {
      Logger.warn(`Found ${invalidSkills.length} invalid SKILL.md file(s):`);
      invalidSkills.forEach(s => {
        Logger.warn(`  - ${s.path}: ${s.errors?.join(', ')}`);
      });
    }

    if (validSkills.length === 0) {
      throw new Error('No valid SKILL.md files found');
    }

    // 读取当前配置
    const config = await Storage.readSkillConfig();
    const currentTime = Math.floor(Date.now() / 1000);

    // 安装每个 Skill
    for (const skill of validSkills) {
      if (!skill.name || skill.name === 'unknown') {
        Logger.warn(`Skipping skill with invalid name: ${skill.path}`);
        continue;
      }

      // 检查是否已存在
      if (config.skills[skill.name] && !options.force) {
        Logger.warn(`Skill "${skill.name}" already exists. Use --force to overwrite.`);
        continue;
      }

      const skillPath = Storage.getSkillPath(skill.name, targetAgent, isGlobal);

      // 创建目标目录
      await fs.ensureDir(skillPath);

      // 下载并复制 Skill 文件
      Logger.info(`Installing skill: ${skill.name}`);
      try {
        const rawUrl = await this.convertToRawUrl(skill.path);
        const skillMdContent = await this.downloadFromUrl(`${rawUrl.replace(/\/$/, '')}/${SKILL_FILENAME}`);

        // 写入 SKILL.md
        await fs.writeFile(path.join(skillPath, SKILL_FILENAME), skillMdContent, 'utf-8');

        // 计算 hash
        const hash = await this.calculateDirectoryHash(skillPath);

        // 验证 SKILL.md 以获取信息
        const validation = this.validateSKILLMd(skillMdContent);

        // 更新配置
        config.skills[skill.name] = {
          name: skill.name,
          description: validation.data?.description || '',
          url: skill.path,
          targetAgent,
          isGlobal,
          installedAt: currentTime,
          lastUpdated: currentTime,
          hash,
          localPath: skillPath,
          version: validation.data?.version,
          allowedTools: validation.data?.allowedTools,
        };

        Logger.success(`✓ Installed skill: ${skill.name}`);
      } catch (error) {
        Logger.error(`Failed to install skill "${skill.name}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 保存配置
    await Storage.writeSkillConfig(config);

    Logger.info('');
    Logger.success(`Successfully installed ${validSkills.length} skill(s)`);
  }

  /**
   * 卸载 Skill
   */
  static async uninstall(skillName: string, targetAgent: string, isGlobal: boolean, force: boolean = false): Promise<void> {
    // 读取配置
    const config = await Storage.readSkillConfig();

    if (!config.skills[skillName]) {
      throw new Error(`Skill "${skillName}" not found`);
    }

    const skillInfo = config.skills[skillName];

    // 确认操作
    if (!force) {
      // TODO: 添加交互式确认提示
      Logger.info(`About to remove skill: ${skillName}`);
      Logger.info(`Location: ${skillInfo.localPath}`);
    }

    try {
      // 删除 Skill 目录
      if (await fs.pathExists(skillInfo.localPath)) {
        await fs.remove(skillInfo.localPath);
        Logger.debug(`Removed skill directory: ${skillInfo.localPath}`);
      }

      // 从配置中移除
      delete config.skills[skillName];

      // 保存配置
      await Storage.writeSkillConfig(config);

      Logger.success(`✓ Removed skill: ${skillName}`);
    } catch (error) {
      throw new Error(
        `Failed to remove skill "${skillName}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 列出已安装的 Skills
   */
  static async list(targetAgent?: string, isGlobal?: boolean): Promise<SkillInfo[]> {
    const config = await Storage.readSkillConfig();
    let skills = Object.values(config.skills);

    // 过滤
    if (targetAgent) {
      skills = skills.filter(s => s.targetAgent === targetAgent);
    }

    if (isGlobal !== undefined) {
      skills = skills.filter(s => s.isGlobal === isGlobal);
    }

    return skills;
  }

  /**
   * 更新 Skill
   */
  static async update(skillName: string, targetAgent: string, isGlobal: boolean): Promise<void> {
    const config = await Storage.readSkillConfig();

    if (!config.skills[skillName]) {
      throw new Error(`Skill "${skillName}" not found`);
    }

    const skillInfo = config.skills[skillName];

    Logger.info(`Checking for updates: ${skillName}`);

    try {
      // 检查远程更新
      const rawUrl = await this.convertToRawUrl(skillInfo.url);
      const remoteSkillMdUrl = `${rawUrl.replace(/\/$/, '')}/${SKILL_FILENAME}`;
      const remoteContent = await this.downloadFromUrl(remoteSkillMdUrl);

      // 重新计算本地 hash
      const localHash = await this.calculateDirectoryHash(skillInfo.localPath);

      // 简单比较（实际应该比较特定文件）
      if (localHash === skillInfo.hash) {
        Logger.info(`Skill "${skillName}" is already up to date`);
        return;
      }

      // 有更新，下载新版本
      Logger.info(`Updating skill: ${skillName}`);

      // 备份当前版本（可选）
      const backupPath = `${skillInfo.localPath}.backup.${Date.now()}`;
      await fs.copy(skillInfo.localPath, backupPath);

      try {
        // 写入新版本
        await fs.writeFile(path.join(skillInfo.localPath, SKILL_FILENAME), remoteContent, 'utf-8');

        // 更新配置
        const newHash = await this.calculateDirectoryHash(skillInfo.localPath);
        skillInfo.lastUpdated = Math.floor(Date.now() / 1000);
        skillInfo.hash = newHash;

        // 验证新的 SKILL.md
        const validation = this.validateSKILLMd(remoteContent);
        if (validation.valid && validation.data) {
          skillInfo.description = validation.data.description || skillInfo.description;
          skillInfo.version = validation.data.version;
          skillInfo.allowedTools = validation.data.allowedTools;
        }

        await Storage.writeSkillConfig(config);

        Logger.success(`✓ Updated skill: ${skillName}`);

        // 删除备份
        await fs.remove(backupPath);
      } catch (error) {
        // 更新失败，恢复备份
        await fs.remove(skillInfo.localPath);
        await fs.copy(backupPath, skillInfo.localPath);
        await fs.remove(backupPath);
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Failed to update skill "${skillName}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取 Skill 信息
   */
  static async getSkillInfo(skillName: string): Promise<SkillInfo | null> {
    const config = await Storage.readSkillConfig();
    return config.skills[skillName] || null;
  }

  /**
   * 检查 Skill 是否存在
   */
  static async skillExists(skillName: string): Promise<boolean> {
    const config = await Storage.readSkillConfig();
    return skillName in config.skills;
  }
}
